import { act, renderHook } from "@testing-library/react-native";
import { BehaviorSubject } from "rxjs";
import { MobileMap } from "@mobile-apparatus";
import { getImageSource } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { useImageMarkerSource } from "../src/images/useImageMarkerSource";

const mockCartomancer = {
    zoom$: new BehaviorSubject(10),
    bearing$: new BehaviorSubject(0),
};

jest.mock("@mobile-apparatus", () => ({
    useMobileMachineWard: () => ({ cartomancer: mockCartomancer }),
}));
jest.mock("@the-dead-planet/nav-gauge-gears-route-story-common", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    type MockSource = ReturnType<typeof getImageSource>;
    return {
        selectedImageId$: new BehaviorSubject(null),
        expandedImageGroupId$: new BehaviorSubject(null),
        imageGroupOffset$: new BehaviorSubject(0),
        getGroupedImageSource: async (
            source: MockSource,
            project: (point: [number, number]) => Promise<[number, number]>,
            unproject: (point: [number, number]) => Promise<[number, number]>,
        ) => {
            const point = await project([0, 0]);
            const coordinates = await unproject([point[0] + 40, point[1]]);
            return {
                ...source,
                features: source.features.map((feature) => (
                    {
                        ...feature,
                        geometry: { type: "Point", coordinates },
                    }
                )),
            };
        },
        getImageSourceWithAnchors: (original: MockSource, grouped: MockSource) => ({
            ...grouped,
            features: [
                ...grouped.features,
                {
                    ...original.features[0],
                    properties: {
                        ...original.features[0].properties,
                        markerAnchor: true,
                    },
                },
            ],
        }),
    };
});

test("reuses grouping projections for expanded marker hits and invalidates them during camera movement", async () => {
    jest.useFakeTimers();
    const project = jest.fn(async (): Promise<[number, number]> => [100, 100]);
    const unproject = jest.fn(async (): Promise<[number, number]> => [1, 0]);
    const map = {
        map$: new BehaviorSubject({ project, unproject }),
        mapSize$: new BehaviorSubject({ width: 400, height: 800 }),
        cameraMoving$: new BehaviorSubject(false),
    } as unknown as MobileMap;
    const source: ReturnType<typeof getImageSource> = {
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
                    markerVisible: true,
                },
            },
        ],
    };
    const { result, rerender, unmount } = await renderHook(
        ({ currentSource }) => useImageMarkerSource(map, currentSource, false),
        { initialProps: { currentSource: source } },
    );
    try {
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(project).toHaveBeenCalledTimes(1);
        expect(unproject).toHaveBeenCalledTimes(1);
        expect(
            result.current.hitTargets.current.map(({ point, routePoint }) => ({
                point,
                routePoint,
            })),
        ).toEqual([
            { point: [140, 100], routePoint: [100, 100] },
            { point: [100, 100], routePoint: [100, 100] },
        ]);
        await act(() => map.cameraMoving$.next(true));
        expect(result.current.hitTargets.current).toEqual([]);
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(project).toHaveBeenCalledTimes(1);
        await act(() => map.cameraMoving$.next(false));
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(result.current.hitTargets.current).toHaveLength(2);
        const movedSource: typeof source = {
            ...source,
            features: source.features.map((feature) => ({
                ...feature,
                geometry: { type: "Point", coordinates: [2, 0] },
            })),
        };
        expect(result.current.groupedSource.features[0].geometry.coordinates).toEqual([1, 0]);
        await rerender({ currentSource: movedSource });
        expect(result.current.groupedSource).toBe(movedSource);
        expect(result.current.hitTargets.current).toEqual([]);
        await act(() => jest.advanceTimersByTimeAsync(99));
        expect(result.current.groupedSource).toBe(movedSource);
        await act(() => jest.advanceTimersByTimeAsync(1));
        expect(result.current.groupedSource).not.toBe(movedSource);
        const selectedSource: typeof source = {
            ...source,
            features: [
                { ...source.features[0], properties: { ...source.features[0].properties, markerSelected: true } },
                { ...source.features[0], properties: { ...source.features[0].properties, imageId: 2, markerSelected: false } },
            ],
        };
        await rerender({ currentSource: selectedSource });
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(result.current.hitTargets.current.filter(({ feature }) => !feature.properties.markerAnchor)
            .map(({ feature }) => feature.properties.imageId)).toEqual([2, 1]);
    } finally {
        await unmount();
        jest.useRealTimers();
    }
});
