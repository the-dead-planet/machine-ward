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
import { SliderMarkers } from "../src/player/player-slider/slider-markers/SliderMarkers";
import { SliderMarkerGroup } from "../src/player/player-slider/slider-markers/SliderMarkerGroup";
import { SliderMarkerPanToWholeRoute } from "../src/player/player-slider/slider-markers/SliderMarkerPanToWholeRoute";
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
jest.mock("@apparatus", () => ({
    useMultipleTranslations: (keys: { t: string }[]) => keys.map(({ t }) => t),
}));
jest.mock("@mobile-apparatus", () => ({}));
jest.mock("@ui", () => ({
    ...jest.requireActual("../../../../ui/common/src/forms/clock-input/math"),
    useTheme: () => ({ color: () => "yellow", isDark: false }),
    Icons: { NounProject: { Target: "target" } },
}));
jest.mock("@mobile-ui", () => {
    const { View, Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return { Button: View, Text, Tooltip: View };
});
jest.mock("../../common/src/layer-specification/images/images-layers", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    return { selectedImageId$: new BehaviorSubject(null) };
});
jest.mock("@the-dead-planet/nav-gauge-gears-route-story-common", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    return {
        ...jest.requireActual("../../common/src/tinkers/images"),
        ...jest.requireActual("../../common/src/animatrix/animatrix"),
        ...jest.requireActual("../../common/src/player/player-slider/slider-markers/useSliderMarkerGroups"),
        ...jest.requireMock("../../common/src/layer-specification/images/images-layers"),
        draggingImage$: new BehaviorSubject(null),
        draggingPlacement$: new BehaviorSubject(null),
        highlightIdsBySourceId$: new BehaviorSubject(new Map()),
        imageSourceIds: { thumbnails: "thumbnails" },
        RouteStoryTranslationKey: { Image: "Image", PanToImage: "Pan to image" },
        getDistanceFractionPercent: (fraction: number) => fraction * 100,
        getRoutePlacementAtPercent: (percent: number) => ({ distanceFraction: percent / 100 }),
        getRouteLngLatAtDistanceFraction: () => ({ lng: 2, lat: 3 }),
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
            translationKey={RouteStoryTranslationKey}
            map={{} as MobileMap}
            data$={new BehaviorSubject<ParsingResultWithError>({ geojson: { type: "FeatureCollection", features: [] } })}
            routeGeometryData$={new BehaviorSubject<RouteGeometryData | null>({ totalDistanceMeters: 1000 } as RouteGeometryData)}
            routeTimes$={new BehaviorSubject<RouteTimes | null>({ startTimeEpoch: 0, duration: 1000 } as RouteTimes)}
            images$={images$}
            animatrix={new Animatrix()}
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

test("extracted markers retain group accessibility, selection, and both pan actions", async () => {
    draggingImage$.next(null);
    selectedImageId$.next(2);
    jest.mocked(toggleImageMarkerGroup).mockClear();
    const easeTo = jest.fn();
    const fitBoundsHandler = jest.fn();
    const animatrix = new Animatrix();
    const map = { camera$: new BehaviorSubject({ easeTo }) } as unknown as MobileMap;
    const data$ = new BehaviorSubject<ParsingResultWithError>({
        geojson: { type: "FeatureCollection", features: [] },
        boundingBox: [0, 1, 2, 3],
    });
    const screen = await render(
        <>
            <SliderMarkerGroup
                image={{ id: 1, name: "photo.jpg", progress: 100, distanceFraction: 0.5 }}
                imageIds={[1, 2]}
                percent={50}
                gearId="route-story"
                translationKey={RouteStoryTranslationKey}
                map={map}
                data$={data$}
                routeGeometryData$={new BehaviorSubject<RouteGeometryData | null>({ totalDistanceMeters: 1000 } as RouteGeometryData)}
            />
            <SliderMarkerPanToWholeRoute
                map={map}
                data$={data$}
                animatrix={animatrix}
                fitBoundsHandler={fitBoundsHandler}
            />
        </>,
    );
    try {
        const marker = screen.getByRole("button", { name: "2 × Image: 1, 2" });
        expect(marker.props.accessibilityState.selected).toBe(true);
        await act(() => marker.props.onAccessibilityTap());
        expect(toggleImageMarkerGroup).toHaveBeenCalledWith([1, 2]);
        await act(() => screen.getByLabelText("Pan to image").props.onPress());
        expect(easeTo).toHaveBeenCalledWith({ center: [2, 3], duration: 300 });
        await act(() => screen.getByLabelText(animatrix.translationKey.PanToWholeRouteAtEnd).props.onPress());
        expect(fitBoundsHandler).toHaveBeenCalledWith(map, [0, 1, 2, 3]);
        await act(() => selectedImageId$.next(null));
        expect(screen.getByRole("button", { name: "2 × Image: 1, 2" }).props.accessibilityState.selected).toBe(false);
    } finally {
        await screen.unmount();
    }
});
