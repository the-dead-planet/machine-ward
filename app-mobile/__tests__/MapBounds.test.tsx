import { act, render } from "@testing-library/react-native";
import { ComponentProps } from "react";
import { BehaviorSubject } from "rxjs";
import { Map as MaplibreMap } from "@maplibre/maplibre-react-native";
import { MobileMap } from "@mobile-apparatus";
import { MapCanvas } from "../src/machine/map-canvas/MapCanvas";

const mockCartomancer = {
    bounds$: new BehaviorSubject<GeoJSON.BBox | null>(null),
    zoom$: new BehaviorSubject(0),
    bearing$: new BehaviorSubject(0),
    isInitialised$: new BehaviorSubject(false),
    isStyleLoaded$: new BehaviorSubject(false),
    selectedStyle$: new BehaviorSubject({ id: "background" }),
};
let mockMapProps: ComponentProps<typeof MaplibreMap>;

jest.mock("@mobile-apparatus", () => ({
    useMobileMachineWard: () => ({
        cartomancer: mockCartomancer,
        toolsStation: {},
        signaliumBureau: { removeNotice: jest.fn() },
    }),
}));
jest.mock("@apparatus", () => ({
    Cartomancer: { styles: { background: { style: {} } } },
    updateCompassIcon: jest.fn(),
    updateCurrentZoomIcon: jest.fn(),
}));
jest.mock("@maplibre/maplibre-react-native", () => {
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return {
        Map: (props: ComponentProps<typeof MaplibreMap>) => {
            mockMapProps = props;
            return <View />;
        },
        Camera: () => null,
        LogManager: { onLog: jest.fn() },
    };
});
jest.mock("../src/machine/map-canvas/useMapTools", () => ({ useMapTools: () => {} }));
jest.mock("../src/machine/map-canvas/useMapPanResponder", () => ({ useMapPanResponder: () => ({ panHandlers: {} }) }));
jest.mock("../src/machine/map-canvas/MapCanvasContainer", () => ({ MapCanvasContainer: ({ children }: { children: React.ReactNode }) => children }));

test("publishes native bounds only at region end and clears them when the map unmounts", async () => {
    const map = {
        map$: new BehaviorSubject(null),
        dragPan$: new BehaviorSubject(true),
        cameraMoving$: new BehaviorSubject(false),
        onPressHandlers$: new BehaviorSubject(new Map()),
        onLongPressHandlers$: new BehaviorSubject(new Map()),
    } as unknown as MobileMap;
    const screen = await render(<MapCanvas map={map} />);
    const event = {
        nativeEvent: {
            center: [2, 3],
            bounds: [1, 2, 3, 4],
            zoom: 12.3,
            bearing: 45,
            pitch: 0,
            animated: false,
            userInteraction: true,
        },
    } as Parameters<NonNullable<typeof mockMapProps.onRegionDidChange>>[0];
    await act(() => mockMapProps.onRegionWillChange?.(event));
    expect(mockCartomancer.bounds$.value).toBeNull();
    expect(mockMapProps.onRegionIsChanging).toBeUndefined();
    await act(() => mockMapProps.onRegionDidChange?.(event));
    expect(mockCartomancer.bounds$.value).toEqual([1, 2, 3, 4]);
    expect(mockCartomancer.zoom$.value).toBe(12.3);
    expect(mockCartomancer.bearing$.value).toBe(45);
    await screen.unmount();
    expect(mockCartomancer.bounds$.value).toBeNull();
});
