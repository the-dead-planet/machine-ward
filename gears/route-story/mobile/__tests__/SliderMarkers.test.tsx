import { act, render } from "@testing-library/react-native";
import { GestureResponderEvent, StyleSheet } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { MobileMap } from "@mobile-apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import {
    Animatrix,
    draggingImage$,
    draggingPlacement$,
    highlightIdsBySourceId$,
    imageSourceIds,
    RouteGeometryData,
    RouteStoryTranslationKey,
    RouteTimes,
    RouteStoryState,
    selectedImageId$,
    toggleImageMarkerGroup,
    updateImageDistanceFraction,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { SliderWithMarkers } from "../src/player/player-slider/SliderWithMarkers";
import { SliderMarkerGroup } from "../src/player/player-slider/slider-markers/SliderMarkerGroup";
import { SliderMarkerPanToWholeRoute } from "../src/player/player-slider/slider-markers/SliderMarkerPanToWholeRoute";
import { MobileMarkerImageData } from "../src/images/image-parser";
import { MobilePlayerOperator } from "../src/model";

let mockMeasurementY = 989;
let mockDeferMeasurement = false;
let mockMeasurementCallback: ((x: number, y: number, width: number, height: number) => void) | undefined;

jest.mock("react-native", () => {
    const native = jest.requireActual<typeof import("react-native")>("react-native");
    const React = jest.requireActual<typeof import("react")>("react");
    return Object.defineProperty(Object.create(native), "View", {
        value: React.forwardRef((props: React.ComponentProps<typeof native.View>, reference) => {
            React.useImperativeHandle(reference, () => ({
                measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => {
                    if (mockDeferMeasurement) {
                        mockMeasurementCallback = callback;
                        return;
                    }
                    callback(0, mockMeasurementY, 200, 78);
                },
            }));
            return <native.View {...props} />;
        }),
    });
});
jest.mock("@apparatus", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    const settings$ = new BehaviorSubject({ distanceUnit: "metric", locale: "en" });
    return {
        useMultipleTranslations: (keys: { t: string }[]) => keys.map(({ t }) => t),
        useMachineWard: () => ({
            individuator: {
                settings$,
                formatTimestamp: (epoch: number) => new Date(epoch).toISOString(),
            },
        }),
    };
});
jest.mock("@mobile-apparatus", () => ({
    useMobileMachineWard: () => jest.requireMock("@apparatus").useMachineWard(),
}));
jest.mock("../src/layers/RouteLayer", () => ({}));
jest.mock("@ui", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    const media$ = new BehaviorSubject({ isLessThanMd: false });
    return {
        ...jest.requireActual("../../../../ui/common/src/forms/clock-input/math"),
        useTheme: () => ({ color: (palette: string, shade: number) => `${palette}-${shade}`, isDark: false, media$ }),
        FontType: { Numeric: "numeric" },
        Icons: { NounProject: { Target: "target" } },
    };
});
jest.mock("@mobile-ui", () => {
    const { View, Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return { Button: View, Caption: Text, Text, Tooltip: View, Slider: View };
});
jest.mock("../../common/src/layer-specification/images/images-layers", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    return { selectedImageId$: new BehaviorSubject(null), draggingPlacement$: new BehaviorSubject(null) };
});
jest.mock("@the-dead-planet/nav-gauge-gears-route-story-common", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    return {
        ...jest.requireActual("../../common/src/tinkers/images"),
        ...jest.requireActual("../../common/src/tinkers/player"),
        ...jest.requireActual("../../common/src/animatrix/animatrix"),
        ...jest.requireActual("../../common/src/player/player-slider/slider-markers/useSliderMarkerGroups"),
        ...jest.requireActual("../../common/src/player/player-slider/slider-markers/useSliderMarkerReadout"),
        ...jest.requireActual("../../common/src/player/player-slider/slider-markers/slider-marker-specification"),
        ...jest.requireMock("../../common/src/layer-specification/images/images-layers"),
        draggingImage$: new BehaviorSubject(null),
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

test("slider diamond taps never enter drag state; movement commits on release but not cancellation", async () => {
    draggingImage$.next(null);
    selectedImageId$.next(null);
    const images$ = new BehaviorSubject<MarkerImage<MobileMarkerImageData>[]>([
        { id: 1, name: "photo.jpg", progress: 100, distanceFraction: 0.5 },
    ]);
    const dragStates: unknown[] = [];
    const subscription = draggingImage$.subscribe((value) => dragStates.push(value));
    const touch = { nativeEvent: { pageX: 100, pageY: 862 } } as GestureResponderEvent;
    const move = { nativeEvent: { pageX: 120, pageY: 862 } } as GestureResponderEvent;
    const routeTimes$ = new BehaviorSubject<RouteTimes | null>({ startTimeEpoch: 0, duration: 1000 } as RouteTimes);
    const screen = await render(
        <SliderWithMarkers
            gearId="route-story"
            translationKey={RouteStoryTranslationKey}
            map={{} as MobileMap}
            data$={new BehaviorSubject<ParsingResultWithError>({
                geojson: {
                    type: "FeatureCollection",
                    features: [
                        { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: { id: 1, time: "1970-01-01T00:00:00Z" } },
                        { type: "Feature", geometry: { type: "Point", coordinates: [1, 1] }, properties: { id: 2, time: "1970-01-01T00:00:01Z" } },
                    ],
                },
            })}
            routeGeometryData$={new BehaviorSubject<RouteGeometryData | null>({ totalDistanceMeters: 1000, lookup: [{ t: 0, lineProgress: 0 }, { t: 1, lineProgress: 1 }] } as RouteGeometryData)}
            routeTimes$={routeTimes$}
            images$={images$}
            animatrix={new Animatrix()}
            fitBoundsHandler={() => {}}
            progressMs$={new BehaviorSubject(0)}
            state$={new BehaviorSubject<RouteStoryState>({ markerPlayerVisibility: true } as RouteStoryState)}
            playerOperator={{} as MobilePlayerOperator}
        />,
    );
    const marker = () => screen.getByRole("button", { name: "Image 1" });
    try {
        mockMeasurementY = 813;
        let gestureOwner = marker().parent;
        while (gestureOwner && gestureOwner.props.nativeID !== "route-story-player-slider") {
            gestureOwner = gestureOwner.parent;
        }
        expect(gestureOwner?.props.onStartShouldSetResponderCapture).toBeUndefined();
        await act(() => {
            expect(marker().props.onStartShouldSetResponder(touch)).toBe(true);
            marker().props.onResponderGrant(touch);
        });
        expect(highlightIdsBySourceId$.value.get(imageSourceIds.thumbnails)).toEqual(new Set(["1"]));
        await act(() => {
            marker().props.onResponderMove({ nativeEvent: { pageX: 102 } });
            marker().props.onResponderRelease();
        });
        expect(dragStates.every((value) => value === null)).toBe(true);
        expect(toggleImageMarkerGroup).toHaveBeenCalledWith([1]);
        expect(updateImageDistanceFraction).not.toHaveBeenCalled();

        for (const cancelled of [false, true]) {
            mockDeferMeasurement = !cancelled;
            await act(() => {
                marker().props.onStartShouldSetResponder(touch);
                marker().props.onResponderGrant(touch);
                marker().props.onResponderMove(move);
            });
            if (mockDeferMeasurement) {
                expect(draggingImage$.value).toBeNull();
                mockDeferMeasurement = false;
                await act(() => mockMeasurementCallback?.(0, 813, 200, 78));
            }
            expect(draggingImage$.value).toEqual({ id: 1, interaction: "player" });
            expect(draggingPlacement$.value?.distanceFraction).toBe(0.6);
            expect(screen.getByText("60% · 0.60 km", { includeHiddenElements: true })).toBeTruthy();
            expect(screen.getByText("1970-01-01T00:00:00.600Z", { includeHiddenElements: true })).toBeTruthy();
            await act(() => routeTimes$.next(null));
            expect(screen.getByText("60% · 0.60 km", { includeHiddenElements: true })).toBeTruthy();
            expect(screen.queryByText("1970-01-01T00:00:00.600Z", { includeHiddenElements: true })).toBeNull();
            await act(() => routeTimes$.next({ startTimeEpoch: 0, duration: 1000 } as RouteTimes));
            await act(() => {
                if (cancelled) {
                    marker().props.onResponderTerminate();
                } else {
                    marker().props.onResponderRelease();
                }
            });
            expect(draggingImage$.value).toBeNull();
            expect(draggingPlacement$.value).toBeNull();
            expect(screen.queryByText("60% · 0.60 km", { includeHiddenElements: true })).toBeNull();
        }
        expect(updateImageDistanceFraction).toHaveBeenCalledTimes(1);
        expect(updateImageDistanceFraction).toHaveBeenCalledWith(images$, 1, 0.6);
        expect(toggleImageMarkerGroup).toHaveBeenCalledTimes(1);
        mockDeferMeasurement = true;
        await act(() => {
            marker().props.onStartShouldSetResponder(touch);
            marker().props.onResponderMove(move);
            marker().props.onResponderRelease();
        });
        mockDeferMeasurement = false;
        await act(() => mockMeasurementCallback?.(0, 813, 200, 78));
        expect(draggingImage$.value).toBeNull();
        expect(updateImageDistanceFraction).toHaveBeenCalledTimes(1);
        expect(toggleImageMarkerGroup).toHaveBeenCalledTimes(1);
        await act(() => {
            draggingImage$.next({ id: 1, interaction: "map" });
            draggingPlacement$.next({ distanceFraction: 0.25, lngLat: { lng: 0.25, lat: 0.25 } });
        });
        const readout = screen.getByText("25% · 0.25 km", { includeHiddenElements: true });
        expect(StyleSheet.flatten(readout.parent?.parent?.props.style).left).toBe("25%");
    } finally {
        draggingImage$.next(null);
        draggingPlacement$.next(null);
        subscription.unsubscribe();
        mockDeferMeasurement = false;
        mockMeasurementCallback = undefined;
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
                drag={{ beginDrag: jest.fn(), grantDrag: jest.fn(), moveDrag: jest.fn(), endDrag: jest.fn() }}
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
        const shapes = marker.children.filter((child) => typeof child !== "string").slice(0, 2);
        for (const shape of shapes) {
            expect(StyleSheet.flatten(shape.props.style).borderColor).toBe("tertiary-500");
            const fill = shape.children.find((child) => typeof child !== "string");
            expect(StyleSheet.flatten(fill?.props.style).backgroundColor).toBe("tertiary-800");
        }
        await act(() => marker.props.onAccessibilityTap());
        expect(toggleImageMarkerGroup).toHaveBeenCalledWith([1, 2]);
        await act(() => screen.getByLabelText("Pan to image").props.onPress());
        expect(easeTo).toHaveBeenCalledWith({ center: [2, 3], duration: 300 });
        await act(() => screen.getByLabelText(animatrix.translationKey.PanToWholeRouteAtEnd).props.onPress());
        expect(fitBoundsHandler).toHaveBeenCalledWith(map, [0, 1, 2, 3]);
        await act(() => selectedImageId$.next(null));
        expect(screen.getByRole("button", { name: "2 × Image: 1, 2" }).props.accessibilityState.selected).toBe(false);
        const unselected = screen.getByRole("button", { name: "2 × Image: 1, 2" }).children.filter((child) => typeof child !== "string").slice(0, 2);
        for (const shape of unselected) {
            expect(StyleSheet.flatten(shape.props.style).borderColor).toBe("transparent");
            const fill = shape.children.find((child) => typeof child !== "string");
            expect(StyleSheet.flatten(fill?.props.style).backgroundColor).toBe("tertiary-500");
        }
        await act(() => screen.getByLabelText("Pan to image").props.onHoverIn());
        expect(highlightIdsBySourceId$.value.get(imageSourceIds.thumbnails)).toEqual(new Set(["1", "2"]));
        const hovered = screen.getByRole("button", { name: "2 × Image: 1, 2" }).children.filter((child) => typeof child !== "string").slice(0, 2);
        for (const shape of hovered) {
            expect(StyleSheet.flatten(shape.props.style).borderColor).toBe("tertiary-500");
            const fill = shape.children.find((child) => typeof child !== "string");
            expect(StyleSheet.flatten(fill?.props.style).backgroundColor).toBe("tertiary-800");
        }
        await act(() => screen.getByLabelText("Pan to image").props.onHoverOut());
        expect(highlightIdsBySourceId$.value.get(imageSourceIds.thumbnails)).toBeUndefined();
    } finally {
        await screen.unmount();
    }
});
