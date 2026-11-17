import { describe, it } from "mocha";
import { expect } from "chai";
import {
    clampPanelLayout,
    clampPanelWidth,
    computeEffectiveWidth,
    LAYOUT_DEFAULTS,
    LAYOUT_MINS,
    PanelLayout,
    PanelState,
} from "../../src";

describe("panel-layout", () => {
    for (const { hasToolPanels, isCollapsed, expected } of [
        { hasToolPanels: false, isCollapsed: false, expected: 0 },
        { hasToolPanels: false, isCollapsed: true, expected: 0 },
        { hasToolPanels: true, isCollapsed: true, expected: LAYOUT_MINS.panels.left },
        { hasToolPanels: true, isCollapsed: false, expected: 400 },
    ]) {
        it(`computes effective width with panels=${hasToolPanels}, collapsed=${isCollapsed}`, () => {
            expect(
                computeEffectiveWidth({ hasToolPanels, isCollapsed, storedSize: 400 }, LAYOUT_MINS.panels.left),
            ).to.equal(expected);
        });
    }

    for (const { requested, opposite, minimum, expected } of [
        { requested: 10, opposite: 360, minimum: LAYOUT_MINS.panels.left, expected: LAYOUT_MINS.panels.left },
        {
            requested: 2000,
            opposite: 360,
            minimum: LAYOUT_MINS.panels.left,
            expected: 1200 - 360 - LAYOUT_MINS.remainingArea.width,
        },
        { requested: 500, opposite: 360, minimum: LAYOUT_MINS.panels.left, expected: 500 },
        { requested: 800, opposite: 0, minimum: LAYOUT_MINS.panels.right, expected: 800 },
        {
            requested: LAYOUT_MINS.panels.left,
            opposite: 360,
            minimum: LAYOUT_MINS.panels.left,
            expected: LAYOUT_MINS.panels.left,
        },
    ]) {
        it(`clamps requested width ${requested} with opposite width ${opposite}`, () => {
            expect(clampPanelWidth(requested, minimum, opposite, 1200)).to.equal(expected);
        });
    }

    describe("clampPanelLayout", () => {
        const basePanel: PanelState = { hasToolPanels: true, isCollapsed: false, storedSize: 400 };
        const bottomPanel: PanelState = { hasToolPanels: true, isCollapsed: false, storedSize: 300 };
        const window = { width: 1200, height: 1000 };
        const remainingWidth = Math.max(LAYOUT_MINS.tools.top, LAYOUT_MINS.remainingArea.width);
        const reservedChromeHeight = 160;
        const layout: PanelLayout = { leftWidth: 400, rightWidth: 400, bottomSecondaryHeight: 300 };

        it("returns the previous reference when nothing changes", () => {
            expect(
                clampPanelLayout(layout, basePanel, basePanel, bottomPanel, window, false, false, reservedChromeHeight),
            ).to.equal(layout);
        });

        for (const side of ["left", "right"] as const) {
            for (const hasIcons of [false, true]) {
                it(`clamps the oversized ${side} panel with icons=${hasIcons}`, () => {
                    const key = side === "left" ? "leftWidth" : "rightWidth";
                    const previous = { ...layout, [key]: 1000 };
                    const result = clampPanelLayout(
                        previous,
                        basePanel,
                        basePanel,
                        bottomPanel,
                        window,
                        hasIcons && side === "left",
                        hasIcons && side === "right",
                        reservedChromeHeight,
                    );
                    expect(result[key]).to.equal(
                        1200 - 400 - remainingWidth - (hasIcons ? LAYOUT_DEFAULTS.icons[side] : 0),
                    );
                });
            }
        }

        it("does not reserve the stored width of an absent panel", () => {
            const absent = { ...basePanel, hasToolPanels: false };
            const result = clampPanelLayout(
                { ...layout, leftWidth: 900 },
                basePanel,
                absent,
                bottomPanel,
                window,
                false,
                false,
                reservedChromeHeight,
            );
            expect(result.leftWidth).to.equal(900);
        });

        it("preserves a collapsed panel's stored width even when cramped and clamps the expanded side", () => {
            const collapsed = { ...basePanel, isCollapsed: true, storedSize: 500 };
            const result = clampPanelLayout(
                { ...layout, leftWidth: 1000, rightWidth: 500 },
                basePanel,
                collapsed,
                bottomPanel,
                { width: 600, height: 800 },
                false,
                false,
                reservedChromeHeight,
            );
            expect(result.rightWidth).to.equal(500);
            expect(result.leftWidth).to.equal(600 - LAYOUT_MINS.panels.right - remainingWidth);
        });

        it("reserves chrome and the remaining main area above the secondary bottom panel", () => {
            const result = clampPanelLayout(
                { ...layout, bottomSecondaryHeight: 900 },
                basePanel,
                basePanel,
                bottomPanel,
                window,
                false,
                false,
                reservedChromeHeight,
            );
            expect(result.bottomSecondaryHeight).to.equal(
                1000 - LAYOUT_MINS.remainingArea.height - reservedChromeHeight,
            );
        });
    });
});
