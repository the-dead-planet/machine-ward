import { act, render } from "@testing-library/react-native";
import { GestureResponderEvent, PanResponder, PanResponderCallbacks, PanResponderGestureState } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { MobileMap } from "@mobile-apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import {
    Animatrix,
    draggingImage$,
    draggingPlacement$,
    RouteGeometryData,
    RouteStoryTranslationKey,
    RouteTimes,
    selectedImageId$,
    toggleImageMarkerGroup,
    updateImageDistanceFraction,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { SliderMarkers } from "../src/player/player-slider/SliderMarkers";
import { MobileMarkerImageData } from "../src/images/image-parser";

jest.mock("react-native", () => {
    const native = jest.requireActual<typeof import("react-native")>("react-native");
    const React = jest.requireActual<typeof import("react")>("react");
    return Object.defineProperty(Object.create(native), "View", {
        value: React.forwardRef((props: React.ComponentProps<typeof native.View>, reference) => {
            React.useImperativeHandle(reference, () => ({
                measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 0, 200, 48),
            }));
            return <native.View {...props} />;
        }),
    });
});
jest.mock("@apparatus", () => ({ useMultipleTranslations: () => ["Image", "Pan to image", "Pan to route"] }));
jest.mock("@mobile-apparatus", () => ({}));
jest.mock("@ui", () => ({
    useTheme: () => ({ color: () => "yellow", isDark: false }),
    Icons: { NounProject: { Target: "target" } },
}));
jest.mock("@mobile-ui", () => {
    const { View, Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return { Button: View, Text, Tooltip: View };
});
jest.mock("@the-dead-planet/nav-gauge-gears-route-story-common", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    return {
        ...jest.requireActual("../../common/src/tinkers/images"),
        draggingImage$: new BehaviorSubject(null),
        draggingPlacement$: new BehaviorSubject(null),
        highlightIdsBySourceId$: new BehaviorSubject(new Map()),
        selectedImageId$: new BehaviorSubject(null),
        imageSourceIds: { thumbnails: "thumbnails" },
        getDistanceFractionPercent: (fraction: number) => fraction * 100,
        getRoutePlacementAtPercent: (percent: number) => ({ distanceFraction: percent / 100 }),
        clearImageMarkerSelection: jest.fn(),
        toggleImageMarkerGroup: jest.fn(),
        updateImageDistanceFraction: jest.fn(),
    };
});

test("slider taps never enter drag state; movement commits on release but not cancellation", async () => {
    draggingImage$.next(null);
    selectedImageId$.next(null);
    const images$ = new BehaviorSubject<MarkerImage<MobileMarkerImageData>[]>([
        { id: 1, name: "photo.jpg", progress: 100, distanceFraction: 0.5 },
    ]);
    let responder: PanResponderCallbacks = {};
    const create = PanResponder.create;
    const spy = jest.spyOn(PanResponder, "create").mockImplementation((callbacks) => {
        responder = callbacks;
        return create(callbacks);
    });
    const dragStates: unknown[] = [];
    const subscription = draggingImage$.subscribe((value) => dragStates.push(value));
    const touch = { nativeEvent: { pageX: 100, pageY: 30 } } as GestureResponderEvent;
    const gesture = { moveX: 102 } as PanResponderGestureState;
    const screen = await render(
        <SliderMarkers
            gearId="route-story"
            translationKey={{} as typeof RouteStoryTranslationKey}
            map={{} as MobileMap}
            data$={new BehaviorSubject<ParsingResultWithError>({ geojson: { type: "FeatureCollection", features: [] } })}
            routeGeometryData$={new BehaviorSubject<RouteGeometryData | null>({ totalDistanceMeters: 1000 } as RouteGeometryData)}
            routeTimes$={new BehaviorSubject<RouteTimes | null>({ startTimeEpoch: 0, duration: 1000 } as RouteTimes)}
            images$={images$}
            animatrix={{
                controls$: new BehaviorSubject({ playbackPacing: "distance" }),
                translationKey: {},
            } as Animatrix}
            fitBoundsHandler={() => {}}
        />,
    );
    try {
        await act(() => {
            expect(responder.onStartShouldSetPanResponderCapture?.(touch, gesture)).toBe(true);
            responder.onPanResponderMove?.(touch, gesture);
            responder.onPanResponderRelease?.(touch, gesture);
        });
        expect(dragStates.every((value) => value === null)).toBe(true);
        expect(toggleImageMarkerGroup).toHaveBeenCalledWith([1]);
        expect(updateImageDistanceFraction).not.toHaveBeenCalled();

        for (const cancelled of [false, true]) {
            await act(() => {
                responder.onStartShouldSetPanResponderCapture?.(touch, gesture);
                responder.onPanResponderMove?.(touch, { ...gesture, moveX: 120 });
            });
            expect(draggingImage$.value).toEqual({ id: 1, interaction: "player" });
            expect(draggingPlacement$.value?.distanceFraction).toBe(0.6);
            await act(() => {
                if (cancelled) {
                    responder.onPanResponderTerminate?.(touch, gesture);
                } else {
                    responder.onPanResponderRelease?.(touch, gesture);
                }
            });
            expect(draggingImage$.value).toBeNull();
            expect(draggingPlacement$.value).toBeNull();
        }
        expect(updateImageDistanceFraction).toHaveBeenCalledTimes(1);
        expect(updateImageDistanceFraction).toHaveBeenCalledWith(images$, 1, 0.6);
        expect(toggleImageMarkerGroup).toHaveBeenCalledTimes(1);
    } finally {
        subscription.unsubscribe();
        spy.mockRestore();
        await screen.unmount();
    }
});
