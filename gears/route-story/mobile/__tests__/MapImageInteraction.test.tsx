import { act, renderHook } from "@testing-library/react-native";
import { GestureResponderEvent } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MobileMap } from "@mobile-apparatus";
import { MarkerImage } from "@apparatus";
import { GeoJson } from "@tinker-chest";
import {
    draggingImage$,
    draggingPlacement$,
    RouteGeometryData,
    updateImageDistanceFraction,
    selectMapImageMarker,
    clearImageMarkerSelection,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useMapImageInteraction } from "../src/images/useMapImageInteraction";
import { MobileMarkerImageData } from "../src/images/image-parser";
import { MapImageHitTarget } from "../src/images/model";

jest.mock("@the-dead-planet/machine-ward-gears-route-story-common", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    return {
        draggingImage$: new BehaviorSubject(null),
        draggingPlacement$: new BehaviorSubject(null),
        MAP_IMAGE_MARKER_OFFSET_Y: -35,
        MAP_IMAGE_ANCHOR_SIDE: 4,
        MAP_IMAGE_MARKER_OUTLINE_WIDTH: 2,
        getMapImageThumbnailOffsetY: (
            groupSize: number | undefined,
            scale = 1,
            offsetY = -35,
        ) => offsetY - (groupSize === 1 ? (scale - 1) * 25 : 0),
        MAP_IMAGE_COUNT_BADGE_OFFSET: [20, -20],
        THUMBNAIL_IMAGE_SIZE: 50,
        getRoutePlacement: () => ({ distanceFraction: 0.5 }),
        updateImageDistanceFraction: jest.fn(),
        selectMapImageMarker: jest.fn(),
        clearImageMarkerSelection: jest.fn(),
    };
});

test("claims cached hits only after animation, leaves the pager active, and preserves drag ownership and cancellation", async () => {
    const queryRenderedFeatures = jest.fn();
    const project = jest.fn();
    const unproject = jest.fn(async (point: number[]) => point);
    const map = {
        map$: new BehaviorSubject({ queryRenderedFeatures, project, unproject }),
        dragPan$: new BehaviorSubject(true),
        panResponderOffset: [0, 0],
        onPanResponderShouldStartHandlers$: new BehaviorSubject(new Map()),
        onPanResponderStartHandlers$: new BehaviorSubject(new Map()),
        onPanResponderMoveHandlers$: new BehaviorSubject(new Map()),
        onPanResponderEndHandlers$: new BehaviorSubject(new Map()),
        onPressHandlers$: new BehaviorSubject(new Map()),
    } as unknown as MobileMap;
    const target: MapImageHitTarget = {
        point: [100, 65],
        routePoint: [100, 100],
        feature: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: {
                imageId: 1,
                distanceFromStartMeters: 0,
                iconImageId: "image",
                iconImageThumbnailId: "thumbnail",
                markerOffsetY: 0,
            },
        },
    };
    const images = new BehaviorSubject<MarkerImage<MobileMarkerImageData>[]>([
        { id: 1, name: "photo.jpg", progress: 100, distanceFraction: 0.1 },
        { id: 2, name: "other.jpg", progress: 100, distanceFraction: 0.1 },
    ]);
    const geojson: GeoJson = { type: "FeatureCollection", features: [] };
    const geometry: RouteGeometryData = {
        spline: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [] },
            properties: {},
        },
        lookup: [],
        splinePoints: [],
        totalDistanceMeters: 1,
    };
    const touch = (x: number, y: number) =>
        ({
            nativeEvent: {
                locationX: x,
                locationY: y,
                pageX: x,
                pageY: y,
                touches: [{}],
            },
        }) as unknown as GestureResponderEvent;
    const paginationTarget: { current: [number, number] | null } = {
        current: null,
    };
    const hitTargets = { current: [target] };
    const paginationDimensions = { current: { width: 92, height: 72 } };
    const { unmount, rerender } = await renderHook(({ markersReady }: { markersReady: boolean }) =>
        useMapImageInteraction(
            map,
            images,
            geojson,
            geometry,
            true,
            hitTargets,
            paginationTarget,
            paginationDimensions,
            markersReady,
        ),
        { initialProps: { markersReady: true } },
    );
    const id = "route-story-thumbnails-layer";
    const start = async () => {
        expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(100, 65))).toBe(true);
        await act(() => map.onPanResponderStartHandlers$.value.get(id)?.(touch(100, 65)));
    };
    expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(500, 500))).toBe(false);
    target.point = [100, 100];
    target.feature.properties.markerOffsetY = -35;
    expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(100, 65))).toBe(true);
    await rerender({ markersReady: false });
    await act(() => map.onPanResponderStartHandlers$.value.get(id)?.(touch(100, 65)));
    expect(draggingImage$.value).toBeNull();
    expect(map.dragPan$.value).toBe(false);
    await act(() => map.onPanResponderEndHandlers$.value.get(id)?.(touch(100, 65), true));
    expect(unproject).not.toHaveBeenCalled();
    await rerender({ markersReady: true });
    target.point = [100, 65];
    target.feature.properties.markerOffsetY = 0;
    target.feature.properties.markerScale = 0.9;
    expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(135, 65))).toBe(false);
    target.feature.properties.markerScale = 1;
    await start();
    expect(map.dragPan$.value).toBe(false);
    expect(map.panResponderOffset).toEqual([0, 35]);
    expect(draggingImage$.value).toBeNull();
    expect(queryRenderedFeatures).not.toHaveBeenCalled();
    expect(project).not.toHaveBeenCalled();
    await act(() => map.onPanResponderMoveHandlers$.value.get(id)?.(touch(102, 65)));
    expect(draggingImage$.value).toBeNull();
    expect(unproject).not.toHaveBeenCalled();
    await act(() => map.onPanResponderMoveHandlers$.value.get(id)?.(touch(110, 65)));
    expect(draggingImage$.value).toEqual({ id: 1, interaction: "map" });
    const startHandler = map.onPanResponderStartHandlers$.value.get(id);
    await rerender({ markersReady: false });
    expect(map.dragPan$.value).toBe(false);
    expect(draggingImage$.value?.id).toBe(1);
    expect(map.panResponderOffset).toEqual([0, 35]);
    expect(map.onPanResponderStartHandlers$.value.get(id)).toBe(startHandler);
    await act(() => map.onPanResponderEndHandlers$.value.get(id)?.(touch(110, 65), false));
    expect(unproject).toHaveBeenCalledWith([110, 100]);
    expect(updateImageDistanceFraction).toHaveBeenCalledWith(images, 1, 0.5);
    expect(map.dragPan$.value).toBe(true);
    await rerender({ markersReady: true });
    jest.mocked(updateImageDistanceFraction).mockClear();
    await start();
    unproject.mockClear();
    await act(() => map.onPanResponderEndHandlers$.value.get(id)?.(touch(110, 65), true));
    expect(updateImageDistanceFraction).not.toHaveBeenCalled();
    expect(unproject).not.toHaveBeenCalled();
    expect(map.dragPan$.value).toBe(true);
    hitTargets.current = [
        target,
        {
            ...target,
            point: [100, 30],
            feature: {
                ...target.feature,
                properties: {
                    ...target.feature.properties,
                    imageId: 2,
                    markerSelected: true,
                },
            },
        },
    ];
    await start();
    await act(() => map.onPanResponderMoveHandlers$.value.get(id)?.(touch(110, 65)));
    expect(draggingImage$.value?.id).toBe(1);
    await act(() => map.onPanResponderEndHandlers$.value.get(id)?.(touch(100, 65), true));
    hitTargets.current = [target];
    hitTargets.current.push({
        point: [100, 65],
        routePoint: [100, 65],
        feature: {
            ...target.feature,
            properties: {
                ...target.feature.properties,
                imageId: 2,
                markerSelected: true,
                markerAnchor: true,
            },
        },
    });
    await start();
    await act(() => map.onPanResponderMoveHandlers$.value.get(id)?.(touch(110, 65)));
    expect(draggingImage$.value?.id).toBe(2);
    await act(() => map.onPanResponderEndHandlers$.value.get(id)?.(touch(100, 65), true));
    hitTargets.current = [target];
    target.feature.properties.markerCount = 2;
    target.feature.properties.markerGroupSize = 2;
    jest.mocked(clearImageMarkerSelection).mockClear();
    unproject.mockClear();
    const press = map.onPressHandlers$.value.get(id);
    const pressEvent = {} as Parameters<NonNullable<typeof press>>[0];
    await start();
    await act(() => press?.(pressEvent));
    expect(clearImageMarkerSelection).not.toHaveBeenCalled();
    await act(() => map.onPanResponderEndHandlers$.value.get(id)?.(touch(100, 65), false));
    expect(selectMapImageMarker).toHaveBeenCalledWith(1, 2, 1);
    expect(unproject).not.toHaveBeenCalled();
    await act(() => press?.(pressEvent));
    expect(clearImageMarkerSelection).not.toHaveBeenCalled();
    expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(500, 500))).toBe(false);
    await act(() => press?.(pressEvent));
    expect(clearImageMarkerSelection).toHaveBeenCalledTimes(1);
    await start();
    expect(draggingImage$.value).toBeNull();
    await act(() => map.onPanResponderMoveHandlers$.value.get(id)?.(touch(110, 65)));
    expect(draggingImage$.value?.id).toBe(1);
    await act(() => map.onPanResponderEndHandlers$.value.get(id)?.(touch(110, 65), false));
    expect(updateImageDistanceFraction).toHaveBeenCalledTimes(1);
    expect(updateImageDistanceFraction).toHaveBeenCalledWith(images, 1, 0.5);
    expect(map.dragPan$.value).toBe(true);
    paginationTarget.current = [300, 300];
    await rerender({ markersReady: false });
    expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(100, 65))).toBe(false);
    expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(100, 100))).toBe(false);
    for (const [x, y] of [
        [312, 300],
        [344, 300],
        [300, 266],
    ]) {
        expect(map.onPanResponderShouldStartHandlers$.value.get(id)?.(touch(x, y))).toBe(false);
        await act(() => press?.(pressEvent));
        expect(clearImageMarkerSelection).toHaveBeenCalledTimes(2);
    }
    await rerender({ markersReady: true });
    await start();
    expect(map.dragPan$.value).toBe(false);
    let finishProjection: (coordinate: number[]) => void = () => {
        throw new Error("Projection was not started");
    };
    unproject.mockImplementationOnce(() => new Promise((resolve) => {
        finishProjection = resolve;
    }));
    const moving = map.onPanResponderMoveHandlers$.value.get(id)?.(touch(110, 65));
    expect(draggingImage$.value?.id).toBe(1);
    await unmount();
    await act(async () => {
        finishProjection([1, 1]);
        await moving;
    });
    expect(draggingImage$.value).toBeNull();
    expect(draggingPlacement$.value).toBeNull();
    expect(map.dragPan$.value).toBe(true);
    expect(map.onPanResponderShouldStartHandlers$.value.size).toBe(0);
});
