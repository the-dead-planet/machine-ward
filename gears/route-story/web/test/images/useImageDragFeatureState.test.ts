import { expect } from "chai";
import { it } from "mocha";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import type { Map } from "maplibre-gl";
import {
    draggingImage$,
    imageSourceIds,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { useImageDragFeatureState } from "../../src/images/useImageDragFeatureState";

it("targets the thumbnail source, retains paint ownership on rerender, and clears only drag state when changing maps", async () => {
    const environment = Object.getOwnPropertyDescriptor(
        globalThis,
        "IS_REACT_ACT_ENVIRONMENT",
    );
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
        value: true,
        configurable: true,
    });
    const previousDrag = draggingImage$.value;
    draggingImage$.next(null);
    const writes: unknown[] = [];
    let attached = true;
    const first = {
        getSource: () => ({}),
        setFeatureState: (target: object, state: object) =>
            writes.push(["first", "set", target, state]),
        removeFeatureState: (target: object, key: string) =>
            writes.push(["first", "remove", target, key]),
    } as unknown as Map;
    const second = {
        getSource: () => (attached ? {} : undefined),
        setFeatureState: (target: object, state: object) =>
            writes.push(["second", "set", target, state]),
        removeFeatureState: (target: object, key: string) =>
            writes.push(["second", "remove", target, key]),
    } as unknown as Map;
    const Probe = ({ map }: { map: Map }) => {
        useImageDragFeatureState(map);
        return null;
    };
    const root = createRoot();
    try {
        await act(async () =>
            root.render(createElement(Probe, { map: first })),
        );
        await act(async () => {
            draggingImage$.next({ id: 1, interaction: "map" });
        });
        await act(async () =>
            root.render(createElement(Probe, { map: first })),
        );
        expect(writes).to.deep.equal([
            [
                "first",
                "set",
                { source: imageSourceIds.thumbnails, id: 3 },
                { dragging: true },
            ],
            [
                "first",
                "set",
                { source: imageSourceIds.thumbnails, id: 4 },
                { dragging: true },
            ],
        ]);
        await act(async () =>
            root.render(createElement(Probe, { map: second })),
        );
        expect(writes.slice(2)).to.deep.equal([
            [
                "first",
                "remove",
                { source: imageSourceIds.thumbnails, id: 3 },
                "dragging",
            ],
            [
                "first",
                "remove",
                { source: imageSourceIds.thumbnails, id: 4 },
                "dragging",
            ],
            [
                "second",
                "set",
                { source: imageSourceIds.thumbnails, id: 3 },
                { dragging: true },
            ],
            [
                "second",
                "set",
                { source: imageSourceIds.thumbnails, id: 4 },
                { dragging: true },
            ],
        ]);
        attached = false;
        await act(async () => root.unmount());
        expect(writes).to.have.length(6);
    } finally {
        await act(async () => root.unmount());
        draggingImage$.next(previousDrag);
        if (environment) {
            Object.defineProperty(
                globalThis,
                "IS_REACT_ACT_ENVIRONMENT",
                environment,
            );
        } else {
            Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
        }
    }
});
