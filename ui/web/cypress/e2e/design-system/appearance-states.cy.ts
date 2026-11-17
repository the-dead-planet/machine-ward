describe("Appearance state priority", () => {
    for (const { storyId, root, paint, property, glyphs } of [
        {
            storyId: "gizmos-button--playground",
            root: ".story button",
            paint: "",
            property: "background-color",
            glyphs: "",
        },
        {
            storyId: "hud-panel--playground",
            root: '.story [data-interactive="true"]',
            paint: "",
            property: "background-color",
            glyphs: "",
        },
        {
            storyId: "hud-hexagon--playground",
            root: '.story [data-interactive="true"]',
            paint: '[class*="polygon-base"]',
            property: "fill",
            glyphs: "",
        },
        {
            storyId: "hud-octagonalpanel--playground",
            root: '.story [data-interactive="true"]',
            paint: '[class*="paint"]',
            property: "fill",
            glyphs: "",
        },
        {
            storyId: "hud-notchedpanel--playground",
            root: '.story [data-interactive="true"]',
            paint: '[class*="paint"]',
            property: "fill",
            glyphs: "",
        },
        {
            storyId: "forms-toggleswitch--playground",
            root: ".story label:has(input)",
            paint: '[class*="track"]',
            property: "background-color",
            glyphs: '[class*="label"]',
        },
        ...["checkbox", "radio"].flatMap((control) =>
            ["square", "hexagon"].map((corners) => ({
                storyId: `forms-${control}--playground`,
                root: `.story label:has(input[type="${control}"])`,
                paint: corners === "hexagon" ? '[class*="polygon-base"]' : '[aria-hidden="true"]',
                property: corners === "hexagon" ? "fill" : "background-color",
                glyphs: '[aria-hidden="true"]',
                corners,
            })),
        ),
    ]) {
        it(`${storyId} ${paint} prioritizes highlighted over focus and disabled over both`, () => {
            cy.visit(
                `/iframe.html?id=${storyId}&viewMode=story&args=variant:fill;interactive:true;tabIndex:0;children:Control`,
            );
            cy.get(".story [data-appearance-variant]").should("exist");
            const update = (updatedArgs: Record<string, unknown>) =>
                cy
                    .window()
                    .its("__STORYBOOK_PREVIEW__.channel")
                    .invoke("emit", "updateStoryArgs", { storyId, updatedArgs });
            const expectPaint = (state: string) =>
                cy.get(root).should(($root) => {
                    const element = $root[0];
                    const surface = paint ? element.querySelector(paint)! : element;
                    const glyph = glyphs ? element.querySelector(glyphs)! : element;
                    const reference = element.ownerDocument.createElement("span");
                    reference.style.backgroundColor = `var(--appearance-${state}-surface)`;
                    reference.style.color = `var(--appearance-${state}-glyphs)`;
                    const appearanceOwner = surface.closest("[data-appearance-variant]")!;
                    appearanceOwner.append(reference);
                    try {
                        const window = element.ownerDocument.defaultView!;
                        expect(
                            window.getComputedStyle(appearanceOwner).getPropertyValue(`--appearance-${state}-surface`).trim(),
                        ).not.to.equal("");
                        expect(window.getComputedStyle(surface).getPropertyValue(property)).to.equal(
                            window.getComputedStyle(reference).backgroundColor,
                        );
                        expect(window.getComputedStyle(glyph).color).to.equal(window.getComputedStyle(reference).color);
                    } finally {
                        reference.remove();
                    }
                });
            const corners = paint.includes("polygon-base") && storyId.startsWith("forms-") ? "hexagon" : "square";
            update({
                corners,
                interactive: true,
                tabIndex: 0,
                children: "Control",
                variant: "fill",
                highlighted: false,
                disabled: false,
            });
            expectPaint("default");
            cy.get(root).then(($root) => {
                const focusable = $root[0].querySelector("input") ?? $root[0];
                cy.wrap(focusable).focus();
            });
            expectPaint("hover-focus");
            update({ highlighted: true });
            expectPaint("active-pressed");
            update({ disabled: true });
            expectPaint("disabled");
        });
    }
});
