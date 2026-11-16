import { renderHook } from "@testing-library/react-native";
import { ImageMarkerSource } from "@the-dead-planet/nav-gauge-gears-route-story-common/src/layer-specification/images/images-sources";
import { useImageMarkerConnections } from "@the-dead-planet/nav-gauge-gears-route-story-common/src/layer-specification/images/useImageMarkerConnections";

jest.mock("@apparatus", () => ({ FeatureStateProps: {} }));

test("keeps the line source unchanged on selection and size changes, but updates moved or hidden lines", async () => {
    const original: ImageMarkerSource = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: { type: "Point", coordinates: [0, 0] },
                properties: {
                    imageId: 1,
                    distanceFromStartMeters: 0,
                    iconImageId: "image",
                    iconImageThumbnailId: "thumbnail",
                },
            },
        ],
    };
    const grouped: ImageMarkerSource = {
        ...original,
        features: original.features.map((feature) => ({
            ...feature,
            geometry: { type: "Point", coordinates: [1, 1] },
            properties: {
                ...feature.properties,
                markerVisible: true,
                markerScale: 0.9,
            },
        })),
    };
    const hook = await renderHook(
        ({ source }: { source: ImageMarkerSource }) => useImageMarkerConnections(original, source),
        { initialProps: { source: grouped } },
    );
    const initial = hook.result.current;
    const selected: ImageMarkerSource = {
        ...grouped,
        features: grouped.features.map((feature) => ({
            ...feature,
            properties: {
                ...feature.properties,
                markerSelected: true,
                markerScale: 1.1,
            },
        })),
    };
    await hook.rerender({ source: selected });
    expect(hook.result.current).toBe(initial);
    const moved: ImageMarkerSource = {
        ...selected,
        features: selected.features.map((feature) => ({
            ...feature,
            geometry: { type: "Point", coordinates: [2, 2] },
        })),
    };
    await hook.rerender({ source: moved });
    expect(hook.result.current).not.toBe(initial);
    expect(hook.result.current.features[0].geometry.coordinates).toEqual([
        [0, 0],
        [2, 2],
    ]);
    await hook.rerender({ source: { ...grouped, features: [] } });
    expect(hook.result.current.features).toEqual([]);
    await hook.unmount();
});
