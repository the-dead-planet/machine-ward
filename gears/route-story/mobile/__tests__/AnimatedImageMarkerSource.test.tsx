import { act, renderHook } from "@testing-library/react-native";
import type { RouteGeometryData } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { ImageMarkerSource } from "@the-dead-planet/machine-ward-gears-route-story-common/src/layer-specification/images/images-sources";
import { useAnimatedImageMarkerSource } from "@the-dead-planet/machine-ward-gears-route-story-common/src/layer-specification/images/useAnimatedImageMarkerSource";
import { getGroupedImageSource, getImageMarkerConnections } from "@the-dead-planet/machine-ward-gears-route-story-common/src/layer-specification/images/grouped-image-source";
import { draggingImage$, draggingPlacement$ } from "@the-dead-planet/machine-ward-gears-route-story-common/src/layer-specification/images/images-layers";
import { useMapImageDragSource } from "../src/images/useMapImageDragSource";

test("animates paging, reverses from the displayed frame, and skips paging motion when reduced", async () => {
    jest.useFakeTimers();
    const source: ImageMarkerSource = {
        type: "FeatureCollection",
        features: Array.from({ length: 7 }, (_value, imageId) => ({
            type: "Feature",
            id: imageId,
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: {
                imageId,
                distanceFromStartMeters: 0,
                iconImageId: "image",
                iconImageThumbnailId: "thumbnail",
            },
        })),
    };
    const identity = (point: [number, number]): [number, number] => point;
    const initial = await getGroupedImageSource(source, identity, identity, 0, 0, 0);
    const next = await getGroupedImageSource(source, identity, identity, 0, 0, 6);
    const hook = await renderHook(
        ({ source, reducedMotion }: { source: ImageMarkerSource; reducedMotion: boolean }) => useAnimatedImageMarkerSource(source, reducedMotion),
        {
            initialProps: {
                source: initial,
                reducedMotion: false,
            },
        },
    );
    try {
        await hook.rerender({ source: next, reducedMotion: false });
        await act(() => jest.advanceTimersByTimeAsync(64));
        const interrupted = hook.result.current;
        expect(interrupted.features[0].geometry.coordinates).not.toEqual(initial.features[0].geometry.coordinates);
        expect(interrupted.features[0].geometry.coordinates).not.toEqual(next.features[0].geometry.coordinates);
        expect(interrupted.features[6].properties.markerRevealScale).toBeGreaterThan(0);
        expect(interrupted.features[6].properties.markerRevealScale).toBeLessThan(1);
        await hook.rerender({ source: initial, reducedMotion: false });
        expect(hook.result.current.features[0].geometry).toEqual(interrupted.features[0].geometry);
        expect(hook.result.current.features[6].properties.markerRevealScale).toBe(interrupted.features[6].properties.markerRevealScale);
        await act(() => jest.advanceTimersByTimeAsync(300));
        expect(hook.result.current).toBe(initial);
        await hook.rerender({ source: next, reducedMotion: true });
        expect(hook.result.current).toBe(next);
    } finally {
        await hook.unmount();
        jest.useRealTimers();
    }
});

test("finishes interrupted group motion at the latest target and respects reduced motion", async () => {
    jest.useFakeTimers();
    const collapsed: ImageMarkerSource = {
        type: "FeatureCollection",
        features: [0, 1].map((imageId) => ({
            type: "Feature",
            id: imageId,
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: {
                imageId,
                distanceFromStartMeters: 0,
                iconImageId: "image",
                iconImageThumbnailId: "thumbnail",
                markerGroupId: 0,
                markerSlot: imageId,
                markerVisible: imageId === 0,
                markerExpanded: false,
            },
        })),
    };
    const expanded: ImageMarkerSource = {
        ...collapsed,
        features: collapsed.features.map((feature) => ({
            ...feature,
            geometry: { type: "Point", coordinates: [10, 10] },
            properties: {
                ...feature.properties,
                markerVisible: true,
                markerExpanded: true,
                markerScale: feature.properties.imageId === 0 ? 1 : 0.9,
            },
        })),
    };
    const hook = await renderHook(
        ({ source, reducedMotion }: { source: ImageMarkerSource; reducedMotion: boolean }) => useAnimatedImageMarkerSource(source, reducedMotion),
        { initialProps: { source: collapsed, reducedMotion: false } },
    );
    try {
        await hook.rerender({ source: expanded, reducedMotion: false });
        await act(() => jest.advanceTimersByTimeAsync(64));
        expect(hook.result.current.features[0].geometry.coordinates[0]).toBeGreaterThan(0);
        expect(hook.result.current.features[0].geometry.coordinates[0]).toBeLessThan(10);
        await hook.rerender({ source: collapsed, reducedMotion: false });
        await act(() => jest.advanceTimersByTimeAsync(400));
        expect(hook.result.current).toBe(collapsed);
        await hook.rerender({ source: expanded, reducedMotion: true });
        expect(hook.result.current).toBe(expanded);
        const selected: ImageMarkerSource = {
            ...expanded,
            features: expanded.features.map((feature) => ({
                ...feature,
                properties: {
                    ...feature.properties,
                    markerScale: feature.properties.imageId === 1 ? 1 : 0.9,
                },
            })),
        };
        await hook.rerender({ source: selected, reducedMotion: false });
        await act(() => jest.advanceTimersByTimeAsync(64));
        expect(hook.result.current.features[0].properties.markerScale).toBeGreaterThan(0.9);
        expect(hook.result.current.features[0].properties.markerScale).toBeLessThan(1);
        expect(hook.result.current.features[1].properties.markerScale).toBeGreaterThan(0.9);
        expect(hook.result.current.features[1].properties.markerScale).toBeLessThan(1);
        await hook.rerender({ source: expanded, reducedMotion: false });
        await act(() => jest.advanceTimersByTimeAsync(400));
        expect(hook.result.current).toBe(expanded);
        await hook.rerender({ source: selected, reducedMotion: true });
        expect(hook.result.current).toBe(selected);
    } finally {
        await hook.unmount();
        jest.useRealTimers();
    }
});

test("commits a drag release immediately when placement animation is disabled, without a transient connector", async () => {
    jest.useFakeTimers();
    const initial: ImageMarkerSource = {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: {
                imageId: 1,
                distanceFromStartMeters: 0,
                markerVisible: true,
                markerScale: 1,
                iconImageId: "image",
                iconImageThumbnailId: "thumbnail",
            },
        }],
    };
    const moved: ImageMarkerSource = {
        ...initial,
        features: initial.features.map((feature) => ({
            ...feature,
            geometry: { type: "Point", coordinates: [10, 10] },
            properties: {
                ...feature.properties,
                distanceFromStartMeters: 100,
                markerScale: 0.9,
            },
        })),
    };
    const connectorCounts: number[] = [];
    const hook = await renderHook(({ source, animatePlacement }: { source: ImageMarkerSource; animatePlacement: boolean }) => {
        const rendered = useAnimatedImageMarkerSource(source, false, animatePlacement);
        connectorCounts.push(getImageMarkerConnections(source, rendered).features.length);
        return rendered;
    }, { initialProps: { source: initial, animatePlacement: true } });
    try {
        await hook.rerender({ source: moved, animatePlacement: false });
        expect(hook.result.current.features[0].geometry.coordinates).toEqual([10, 10]);
        await act(() => jest.advanceTimersByTimeAsync(300));
        expect(connectorCounts.every((count) => count === 0)).toBe(true);
        expect(hook.result.current).toBe(moved);
        await hook.rerender({ source: initial, animatePlacement: true });
        await act(() => jest.advanceTimersByTimeAsync(64));
        expect(hook.result.current.features[0].geometry.coordinates[0]).toBeGreaterThan(0);
        expect(hook.result.current.features[0].geometry.coordinates[0]).toBeLessThan(10);
        await act(() => jest.advanceTimersByTimeAsync(300));
        expect(hook.result.current).toBe(initial);
    } finally {
        await hook.unmount();
        jest.useRealTimers();
    }
});

test("shrinks the dropped marker in place without fading it", async () => {
    jest.useFakeTimers();
    const route: RouteGeometryData = {
        spline: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        lookup: [],
        splinePoints: [],
        totalDistanceMeters: 100,
    };
    const sourceAt = (position: number, distance: number): ImageMarkerSource => ({
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [position, position] },
            properties: {
                imageId: 1,
                distanceFromStartMeters: distance,
                markerVisible: true,
                markerOpacity: 1,
                iconImageId: "image",
                iconImageThumbnailId: "thumbnail",
            },
        }],
    });
    draggingImage$.next({ id: 1, interaction: "map" });
    draggingPlacement$.next({ distanceFraction: 0.5, lngLat: { lng: 10, lat: 10 } });
    const hook = await renderHook(({ source }: { source: ImageMarkerSource }) => {
        const { dragSource, dragOrigin } = useMapImageDragSource(source, source, route);
        return { marker: useAnimatedImageMarkerSource(dragSource, false).features[0], dragOrigin };
    }, { initialProps: { source: sourceAt(0, 0) } });
    try {
        expect(hook.result.current.marker.geometry.coordinates).toEqual([10, 10]);
        expect(hook.result.current.marker.properties.markerScale).toBe(1.1);
        expect(hook.result.current.dragOrigin).toEqual([
            expect.objectContaining({ geometry: { type: "Point", coordinates: [0, 0] }, properties: expect.objectContaining({ markerOpacity: 0.4 }) }),
            expect.objectContaining({ geometry: { type: "Point", coordinates: [0, 0] }, properties: expect.objectContaining({ markerOpacity: 0.4, markerAnchor: true }) }),
        ]);
        await hook.rerender({ source: sourceAt(10, 50) });
        expect(hook.result.current.dragOrigin[0].geometry.coordinates).toEqual([0, 0]);
        await act(() => {
            draggingImage$.next(null);
            draggingPlacement$.next(null);
        });
        await act(() => jest.advanceTimersByTimeAsync(80));
        expect(hook.result.current.dragOrigin).toEqual([]);
        expect(hook.result.current.marker.properties.markerScale).toBeLessThan(1.1);
        expect(hook.result.current.marker.properties.markerScale).toBeGreaterThan(1);
        expect(hook.result.current.marker.geometry.coordinates).toEqual([10, 10]);
        expect(hook.result.current.marker.properties.markerOpacity).toBe(1);
        await act(() => jest.advanceTimersByTimeAsync(200));
        expect(hook.result.current.marker).toEqual(sourceAt(10, 50).features[0]);
    } finally {
        draggingImage$.next(null);
        draggingPlacement$.next(null);
        await hook.unmount();
        jest.useRealTimers();
    }
});
