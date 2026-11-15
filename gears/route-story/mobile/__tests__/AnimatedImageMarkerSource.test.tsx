import { act, renderHook } from "@testing-library/react-native";
import { ImageMarkerSource } from "@the-dead-planet/nav-gauge-gears-route-story-common/src/layer-specification/images/images-sources";
import { useAnimatedImageMarkerSource } from "@the-dead-planet/nav-gauge-gears-route-story-common/src/layer-specification/images/useAnimatedImageMarkerSource";

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
        ({ source, reducedMotion }) =>
            useAnimatedImageMarkerSource(source, reducedMotion),
        { initialProps: { source: collapsed, reducedMotion: false } },
    );
    try {
        await hook.rerender({ source: expanded, reducedMotion: false });
        await act(() => jest.advanceTimersByTimeAsync(64));
        expect(
            hook.result.current.features[0].geometry.coordinates[0],
        ).toBeGreaterThan(0);
        expect(
            hook.result.current.features[0].geometry.coordinates[0],
        ).toBeLessThan(10);
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
        expect(
            hook.result.current.features[0].properties.markerScale,
        ).toBeGreaterThan(0.9);
        expect(
            hook.result.current.features[0].properties.markerScale,
        ).toBeLessThan(1);
        expect(
            hook.result.current.features[1].properties.markerScale,
        ).toBeGreaterThan(0.9);
        expect(
            hook.result.current.features[1].properties.markerScale,
        ).toBeLessThan(1);
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