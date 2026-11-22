import { useImperativeHandle } from "react";
import { act, renderHook } from "@testing-library/react-native";
import type { GeoJSONSourceRef } from "@maplibre/maplibre-react-native";
import { glitchmitter } from "@apparatus";
import { draggingImage$ } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useImageDragFeatureState } from "../src/images/useImageDragFeatureState";

jest.mock("@apparatus", () => ({
    ...jest.requireActual(
        "../../../../apparatus/common/src/machine-ward/cartomancer/map-layers/model",
    ),
    glitchmitter: { transmit: jest.fn() },
}));
jest.mock("@the-dead-planet/machine-ward-gears-route-story-common", () => ({
    ...jest.requireActual(
        "../../common/src/layer-specification/images/images-sources",
    ),
    draggingImage$: jest.requireActual(
        "../../common/src/layer-specification/images/images-layers",
    ).draggingImage$,
    useImageDragState: jest.requireActual(
        "../../common/src/layer-specification/images/useImageDragState",
    ).useImageDragState,
}));

const createSource = (): GeoJSONSourceRef => ({
    getData: jest.fn(async (): Promise<GeoJSON.FeatureCollection> => ({
        type: "FeatureCollection",
        features: [],
    })),
    getClusterExpansionZoom: jest.fn(async () => 0),
    getClusterLeaves: jest.fn(async () => []),
    getClusterChildren: jest.fn(async () => []),
    setFeatureState: jest.fn(async () => {}),
    getFeatureState: jest.fn(async () => null),
    removeFeatureState: jest.fn(async () => {}),
    getAnimatableRef: jest.fn(() => null),
});

const mountSource = (source: GeoJSONSourceRef) =>
    renderHook(() => {
        const sourceRef = useImageDragFeatureState();
        useImperativeHandle(sourceRef, () => source);
        return sourceRef;
    });

beforeEach(() => {
    draggingImage$.next(null);
    jest.clearAllMocks();
});

test("updates only the dragged thumbnail and anchor, without repeating writes for the same image", async () => {
    const source = createSource();
    let renderCount = 0;
    const hook = await renderHook(() => {
        renderCount++;
        const sourceRef = useImageDragFeatureState();
        useImperativeHandle(sourceRef, () => source);
        return sourceRef;
    });
    try {
        await act(() => draggingImage$.next({ id: 1, interaction: "map" }));
        expect(jest.mocked(source.setFeatureState).mock.calls).toEqual([
            [{ id: 3 }, { dragging: true }],
            [{ id: 4 }, { dragging: true }],
        ]);
        expect(renderCount).toBe(1);
        await hook.rerender({});
        await act(() => draggingImage$.next({ id: 1, interaction: "player" }));
        expect(source.setFeatureState).toHaveBeenCalledTimes(2);
        expect(source.removeFeatureState).not.toHaveBeenCalled();

        await act(() => draggingImage$.next({ id: 2, interaction: "map" }));
        expect(jest.mocked(source.removeFeatureState).mock.calls).toEqual([
            [{ id: 3 }, "dragging"],
            [{ id: 4 }, "dragging"],
        ]);
        expect(jest.mocked(source.setFeatureState).mock.calls.slice(2)).toEqual(
            [
                [{ id: 5 }, { dragging: true }],
                [{ id: 6 }, { dragging: true }],
            ],
        );
        await act(() => draggingImage$.next(null));
        expect(
            jest.mocked(source.removeFeatureState).mock.calls.slice(2),
        ).toEqual([
            [{ id: 5 }, "dragging"],
            [{ id: 6 }, "dragging"],
        ]);
        expect(renderCount).toBe(2);
    } finally {
        await hook.unmount();
    }
});

test("cleans up the owned state and subscription, then restores the current drag on a new source", async () => {
    draggingImage$.next({ id: 7, interaction: "map" });
    const source = createSource();
    const hook = await mountSource(source);
    expect(jest.mocked(source.setFeatureState).mock.calls).toEqual([
        [{ id: 15 }, { dragging: true }],
        [{ id: 16 }, { dragging: true }],
    ]);
    await hook.unmount();
    expect(jest.mocked(source.removeFeatureState).mock.calls).toEqual([
        [{ id: 15 }, "dragging"],
        [{ id: 16 }, "dragging"],
    ]);
    await act(() => draggingImage$.next({ id: 2, interaction: "map" }));
    expect(source.setFeatureState).toHaveBeenCalledTimes(2);
    const replacement = createSource();
    const replacementHook = await mountSource(replacement);
    expect(jest.mocked(replacement.setFeatureState).mock.calls).toEqual([
        [{ id: 5 }, { dragging: true }],
        [{ id: 6 }, { dragging: true }],
    ]);
    await replacementHook.unmount();
});

test("reports active native failures without stopping later drags and ignores detach failures during cleanup", async () => {
    const error = new Error("Source is not attached");
    const source = createSource();
    jest.mocked(source.setFeatureState).mockRejectedValueOnce(error);
    const hook = await mountSource(source);
    await act(() => draggingImage$.next({ id: 1, interaction: "map" }));
    expect(glitchmitter.transmit).toHaveBeenCalledWith(
        "Error updating map image drag state",
        error,
    );
    await act(() => draggingImage$.next({ id: 2, interaction: "map" }));
    expect(source.setFeatureState).toHaveBeenCalledWith(
        { id: 5 },
        { dragging: true },
    );
    expect(source.setFeatureState).toHaveBeenCalledWith(
        { id: 6 },
        { dragging: true },
    );
    jest.mocked(glitchmitter.transmit).mockClear();
    jest.mocked(source.removeFeatureState).mockImplementation(() => {
        throw error;
    });
    await hook.unmount();
    expect(glitchmitter.transmit).not.toHaveBeenCalled();
});
