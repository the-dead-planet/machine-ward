import { act, render } from "@testing-library/react-native";
import { StyleSheet, ViewStyle } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import { MobileMap } from "@mobile-apparatus";
import {
    Animatrix,
    RouteGeometryData,
    RouteStoryState,
    RouteStoryTranslationKey,
    RouteTimes,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { SliderWithMarkers } from "../src/player/player-slider/SliderWithMarkers";
import { MobileMarkerImageData } from "../src/images/image-parser";
import { MobilePlayerOperator } from "../src/model";

jest.mock("@apparatus", () => ({}));
jest.mock("@mobile-apparatus", () => ({}));
jest.mock("@the-dead-planet/machine-ward-gears-route-story-common", () => ({
    ...jest.requireActual("@the-dead-planet/machine-ward-gears-route-story-common/src/animatrix/animatrix"),
    RouteStoryTranslationKey: {},
    getRouteDistanceFraction: () => 0,
}));
jest.mock("@mobile-ui", () => {
    const { Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
    return { Slider: ({ style, ranges }: { style?: ViewStyle; ranges?: unknown }) => <View testID="player-slider-track" style={style}><Text testID="player-viewport-ranges">{JSON.stringify(ranges ?? [])}</Text></View> };
});
jest.mock("../src/layers/RouteLayer", () => ({
    currentPointRef$: {},
    linesRef$: {},
}));
jest.mock("../src/player/player-slider/slider-markers/SliderMarkers", () => {
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return { SliderMarkers: () => <View testID="player-image-markers" /> };
});
jest.mock("../src/player/player-slider/PlayerSliderLabels", () => {
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return { PlayerSliderLabels: () => <View testID="player-slider-labels" /> };
});

test("keeps a native exclusion target around the player controls even when image markers are hidden", async () => {
    const state$ = new BehaviorSubject({
        markerPlayerVisibility: true,
        viewportRangePlayerVisibility: true,
    } as RouteStoryState);
    const viewportRanges$ = new BehaviorSubject([{ start: 10, end: 30 }]);
    const screen = await render(
        <SliderWithMarkers
            gearId="route-story"
            translationKey={RouteStoryTranslationKey}
            map={{} as MobileMap}
            data$={new BehaviorSubject<ParsingResultWithError>({})}
            routeGeometryData$={
                new BehaviorSubject<RouteGeometryData | null>(null)
            }
            routeTimes$={new BehaviorSubject<RouteTimes | null>(null)}
            images$={
                new BehaviorSubject<MarkerImage<MobileMarkerImageData>[]>([])
            }
            progressMs$={new BehaviorSubject(0)}
            viewportRanges$={viewportRanges$}
            playerOperator={{} as MobilePlayerOperator}
            state$={state$}
            animatrix={new Animatrix()}
            fitBoundsHandler={() => {}}
        />,
    );
    const container = screen.getByTestId("player-slider-track").parent;
    expect(container?.props.nativeID).toBe("route-story-player-slider");
    expect(container?.props.collapsable).toBe(false);
    expect(StyleSheet.flatten(screen.getByTestId("player-slider-track").props.style).zIndex).toBe(1);
    expect(screen.getByTestId("player-image-markers").parent).toBe(container);
    expect(screen.getByTestId("player-viewport-ranges").props.children).toBe('[{"start":10,"end":30}]');
    await act(() => state$.next({ ...state$.value, markerPlayerVisibility: false }));
    expect(screen.queryByTestId("player-image-markers")).toBeNull();
    expect(screen.getByTestId("player-viewport-ranges").props.children).toBe('[{"start":10,"end":30}]');
    await act(() => viewportRanges$.next([]));
    expect(screen.getByTestId("player-viewport-ranges").props.children).toBe('[]');
    expect(screen.getByTestId("player-slider-track").parent).toBe(container);
    await screen.unmount();
});
