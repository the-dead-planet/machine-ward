import { expect } from "chai";
import { it } from "mocha";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import { draggingImage$ } from "../../../src/layer-specification/images/images-layers";
import { useImageDragState } from "../../../src/layer-specification/images/useImageDragState";

it("owns drag transitions, ignores duplicate IDs, and cleans up the old callback before replacing it", async () => {
    const environment = Object.getOwnPropertyDescriptor(
        globalThis,
        "IS_REACT_ACT_ENVIRONMENT",
    );
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
        value: true,
        configurable: true,
    });
    const previousDrag = draggingImage$.value;
    draggingImage$.next({ id: 1, interaction: "map" });
    const events: [string, number, boolean][] = [];
    const first = (imageId: number) => {
        events.push(["first", imageId, true]);
        return () => {
            events.push(["first", imageId, false]);
        };
    };
    const second = (imageId: number) => {
        events.push(["second", imageId, true]);
        return () => {
            events.push(["second", imageId, false]);
        };
    };
    const Probe = ({
        apply,
    }: {
        apply: Parameters<typeof useImageDragState>[0];
    }) => {
        useImageDragState(apply);
        return null;
    };
    const root = createRoot();
    try {
        await act(async () =>
            root.render(createElement(Probe, { apply: first })),
        );
        await act(async () => {
            draggingImage$.next({ id: 1, interaction: "player" });
        });
        await act(async () =>
            root.render(createElement(Probe, { apply: first })),
        );
        expect(events).to.deep.equal([["first", 1, true]]);
        await act(async () => {
            draggingImage$.next({ id: 2, interaction: "map" });
        });
        await act(async () =>
            root.render(createElement(Probe, { apply: second })),
        );
        await act(async () => {
            draggingImage$.next(null);
        });
        await act(async () => {
            draggingImage$.next({ id: 3, interaction: "map" });
        });
        await act(async () => root.unmount());
        await act(async () => {
            draggingImage$.next({ id: 4, interaction: "map" });
        });
        expect(events).to.deep.equal([
            ["first", 1, true],
            ["first", 1, false],
            ["first", 2, true],
            ["first", 2, false],
            ["second", 2, true],
            ["second", 2, false],
            ["second", 3, true],
            ["second", 3, false],
        ]);
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
