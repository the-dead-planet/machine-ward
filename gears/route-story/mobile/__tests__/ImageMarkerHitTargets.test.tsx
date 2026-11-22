import { act, renderHook } from "@testing-library/react-native";
import { BehaviorSubject } from "rxjs";
import { MobileMap } from "@mobile-apparatus";
import {
    expandedImageGroupId$,
    getGroupedImageSource,
    getImageSource,
    getImageSourceWithAnchors,
    imageGroupOffset$,
    selectedImageId$,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useImageMarkerSource } from "../src/images/useImageMarkerSource";

const mockCartomancer = {
    zoom$: new BehaviorSubject(10),
    bearing$: new BehaviorSubject(0),
};

jest.mock("@apparatus", () => jest.requireActual("../../../../apparatus/common/src/machine-ward/cartomancer/map-layers/model"));
jest.mock("@mobile-apparatus", () => ({
    useMobileMachineWard: () => ({ cartomancer: mockCartomancer }),
}));
jest.mock("@the-dead-planet/machine-ward-gears-route-story-common", () => {
    const { BehaviorSubject } = jest.requireActual<typeof import("rxjs")>("rxjs");
    return {
        ...jest.requireActual("../../common/src/layer-specification/images/images-sources"),
        ...jest.requireActual("../../common/src/layer-specification/images/grouped-image-source"),
        selectedImageId$: new BehaviorSubject(null),
        expandedImageGroupId$: new BehaviorSubject(null),
        imageGroupOffset$: new BehaviorSubject(0),
    };
});

const createSource = (count: number, grouped = false): ReturnType<typeof getImageSource> => ({
    type: "FeatureCollection",
    features: Array.from({ length: count }, (_value, imageId) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [grouped ? 0 : imageId / 1000, 0] },
        properties: {
            imageId,
            distanceFromStartMeters: imageId * (grouped ? 10 : 200),
            iconImageId: `image-${imageId}`,
            iconImageThumbnailId: `thumbnail-${imageId}`,
        },
    })),
});

const createMap = () => {
    const project = jest.fn(async ([longitude, latitude]: [number, number]): Promise<[number, number]> => [100 + longitude * 100, 100 + latitude * 100]);
    const unproject = jest.fn(async ([x, y]: [number, number]): Promise<[number, number]> => [(x - 100) / 100, (y - 100) / 100]);
    const map = {
        map$: new BehaviorSubject({ project, unproject }),
        mapSize$: new BehaviorSubject({ width: 400, height: 800 }),
        cameraMoving$: new BehaviorSubject(false),
    } as unknown as MobileMap;
    return { map, project, unproject };
};

beforeEach(() => {
    selectedImageId$.next(null);
    expandedImageGroupId$.next(null);
    imageGroupOffset$.next(0);
    jest.useFakeTimers();
});

afterEach(() => jest.useRealTimers());

test("reuses group projections for selection and hit targets, invalidating them for camera and source changes", async () => {
    selectedImageId$.next(0);
    expandedImageGroupId$.next(0);
    const { map, project, unproject } = createMap();
    const source = createSource(2, true);
    const hook = await renderHook(
        ({ currentSource }: { currentSource: typeof source }) => useImageMarkerSource(map, currentSource, false),
        { initialProps: { currentSource: source } },
    );
    try {
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(project).toHaveBeenCalledTimes(2);
        expect(unproject).toHaveBeenCalledTimes(2);
        expect(hook.result.current.hitTargets.current.map(({ point, routePoint }) => ({ point: point.map(Math.round), routePoint }))).toEqual([
            { point: [100, 158], routePoint: [100, 100] },
            { point: [100, 100], routePoint: [100, 100] },
            { point: [100, 42], routePoint: [100, 100] },
            { point: [100, 100], routePoint: [100, 100] },
        ]);
        await act(() => selectedImageId$.next(1));
        await act(() => jest.advanceTimersByTimeAsync(0));
        expect(project).toHaveBeenCalledTimes(2);
        expect(unproject).toHaveBeenCalledTimes(2);
        expect(hook.result.current.hitTargets.current.map(({ feature }) => feature.properties.imageId)).toEqual([0, 0, 1, 1]);

        await act(() => map.cameraMoving$.next(true));
        expect(hook.result.current.hitTargets.current).toEqual([]);
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(project).toHaveBeenCalledTimes(2);
        await act(() => map.cameraMoving$.next(false));
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(project).toHaveBeenCalledTimes(4);
        expect(hook.result.current.hitTargets.current).toHaveLength(4);

        const movedSource: typeof source = {
            ...source,
            features: source.features.map((feature) => ({ ...feature, geometry: { type: "Point", coordinates: [2, 0] } })),
        };
        await hook.rerender({ currentSource: movedSource });
        expect(hook.result.current.groupedSource).toBe(movedSource);
        expect(hook.result.current.hitTargets.current).toEqual([]);
        await act(() => jest.advanceTimersByTimeAsync(99));
        expect(hook.result.current.groupedSource).toBe(movedSource);
        await act(() => jest.advanceTimersByTimeAsync(1));
        expect(project).toHaveBeenCalledTimes(6);
        expect(hook.result.current.hitTargets.current.filter(({ feature }) => !feature.properties.markerAnchor).map(({ point }) => point.map(Math.round))).toEqual([[300, 42], [300, 158]]);
    } finally {
        await hook.unmount();
    }
});

test.each([50, 250, 1000])("selects among %i photos without native reprojection or the camera debounce", async (count) => {
    const { map, project, unproject } = createMap();
    const source = createSource(count);
    await getGroupedImageSource(source, project, unproject, 0, null);
    expect(project).toHaveBeenCalledTimes(count);
    project.mockClear();
    const hook = await renderHook(() => useImageMarkerSource(map, source, false));
    try {
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(project).toHaveBeenCalledTimes(count);
        await act(() => selectedImageId$.next(0));
        await act(() => jest.advanceTimersByTimeAsync(0));
        expect(project).toHaveBeenCalledTimes(count);
        expect(unproject).not.toHaveBeenCalled();
        const selected = getImageSourceWithAnchors(source, hook.result.current.groupedSource).features.filter(({ properties }) => properties.imageId === 0);
        expect(selected).toHaveLength(2);
        expect(selected.map(({ properties }) => [properties.markerSelected, properties.markerOpacity, properties.highlight])).toEqual([[true, 1, true], [true, 1, true]]);
        expect(selected[0].properties.markerScale).toBeGreaterThan(1);
        await act(() => selectedImageId$.next(null));
        await act(() => jest.advanceTimersByTimeAsync(0));
        expect(project).toHaveBeenCalledTimes(count);
        expect(hook.result.current.groupedSource.features[0].properties.markerSelected).toBe(false);
    } finally {
        await hook.unmount();
    }
});

test("ignores stale projections and retries after a native projection failure", async () => {
    const { map, project } = createMap();
    let finishProjection: (point: [number, number]) => void = () => {
        throw new Error("Projection has not started");
    };
    project.mockImplementationOnce(() => new Promise((resolve) => {
        finishProjection = resolve;
    }));
    const source = createSource(1);
    const hook = await renderHook(() => useImageMarkerSource(map, source, false));
    try {
        await act(() => jest.advanceTimersByTimeAsync(100));
        await act(() => map.cameraMoving$.next(true));
        await act(() => finishProjection([100, 100]));
        expect(hook.result.current.hitTargets.current).toEqual([]);
        expect(hook.result.current.groupedSource).toBe(source);
        await act(() => map.cameraMoving$.next(false));
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(hook.result.current.hitTargets.current).toHaveLength(2);
        project.mockRejectedValueOnce(new Error("Native map detached"));
        await act(() => map.mapSize$.next({ width: 500, height: 800 }));
        await act(() => jest.advanceTimersByTimeAsync(100));
        expect(hook.result.current.hitTargets.current).toEqual([]);
        await act(() => selectedImageId$.next(0));
        await act(() => jest.advanceTimersByTimeAsync(0));
        expect(hook.result.current.groupedSource.features[0].properties.markerSelected).toBe(true);
        expect(hook.result.current.hitTargets.current).toHaveLength(2);
    } finally {
        await hook.unmount();
    }
});

test("retains paging geometry and the pager hit target while reusing expanded group coordinates", async () => {
    const { map, project, unproject } = createMap();
    const source = createSource(12, true);
    expandedImageGroupId$.next(0);
    const hook = await renderHook(() => useImageMarkerSource(map, source, false));
    try {
        await act(() => jest.advanceTimersByTimeAsync(100));
        const initialCalls = unproject.mock.calls.length;
        expect(hook.result.current.paginationTarget.current).not.toBeNull();
        await act(() => {
            imageGroupOffset$.next(4);
            selectedImageId$.next(5);
        });
        await act(() => jest.advanceTimersByTimeAsync(0));
        expect(project).toHaveBeenCalledTimes(12);
        expect(unproject).toHaveBeenCalledTimes(initialCalls);
        const expected = await getGroupedImageSource(
            source,
            async () => [100, 100],
            async ([x, y]) => [(x - 100) / 100, (y - 100) / 100],
            5,
            0,
            4,
        );
        expect(hook.result.current.groupedSource).toEqual(expected);
        expect(hook.result.current.paginationTarget.current?.map(Math.round)).toEqual([100, 158]);
    } finally {
        await hook.unmount();
    }
});
