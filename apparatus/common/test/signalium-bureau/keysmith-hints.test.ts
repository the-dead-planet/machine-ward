import { expect } from "chai";
import { describe, it } from "mocha";
import { type ShortcutStatus } from "../../src/machine-ward/keysmith";
import { getActiveShortcutHints } from "../../src";

const shortcut = (overrides: Partial<ShortcutStatus> = {}): ShortcutStatus => ({
    id: "route-story.move-image-backward",
    label: { n: "route-story", t: "move-image-backward" },
    description: { n: "route-story", t: "move-image-step-description" },
    binding: { key: "ArrowLeft" },
    present: true,
    active: true,
    ...overrides,
});

describe("active shortcut hints", () => {
    it("shows the key and action for an active shortcut", () => {
        const hints = getActiveShortcutHints([shortcut()]);

        expect(Array.from(hints.entries())).to.deep.equal([[
            "route-story.move-image-backward",
            {
                text: { n: "route-story", t: "move-image-backward" },
                keys: ["←"],
            },
        ]]);
    });

    it("ignores shortcuts that cannot run", () => {
        expect(getActiveShortcutHints([shortcut({ active: false })]).size).to.equal(0);
    });
});
