describe("Slider appearance", () => {
    it("renders two capped underlays and updates their bounds from story controls", () => {
        cy.visit("/iframe.html?id=forms-slider--gallery&viewMode=story");
        cy.get('input[type="range"]').should("have.length", 24);
        cy.get('[data-appearance-color="tertiary"][data-appearance-variant="fill-inverse"] [class*="range-tracks"] > div').first().should(($range) => {
            const range = $range[0];
            const slider = range.closest('[data-appearance-variant]')!;
            const window = range.ownerDocument.defaultView!;
            const shade = slider.getAttribute('data-appearance-mode') === 'light' ? 600 : 400;
            const reference = range.ownerDocument.createElement('span');
            reference.style.backgroundColor = `var(--appearance-color-${shade})`;
            slider.append(reference);
            try {
                expect(window.getComputedStyle(reference).getPropertyValue(`--appearance-color-${shade}`).trim()).not.to.equal('');
                expect(window.getComputedStyle(range).backgroundColor).to.equal(window.getComputedStyle(reference).backgroundColor);
            } finally {
                reference.remove();
            }
        });
        cy.get('input[type="range"]').first().closest('[data-appearance-variant]').as('slider');
        cy.get('@slider').find('[class*="range-tracks"] > div').should('have.length', 2).first().then(($range) => {
            const range = $range[0];
            const window = range.ownerDocument.defaultView!;
            const track = range.parentElement!.previousElementSibling!;
            const bounds = range.getBoundingClientRect();
            const trackBounds = track.getBoundingClientRect();
            expect(bounds.left - trackBounds.left).to.be.closeTo(trackBounds.width * 0.1, 0.1);
            expect(bounds.width).to.be.closeTo(trackBounds.width * 0.2, 0.1);
            expect(bounds.top).to.be.closeTo(trackBounds.top - 2, 0.1);
            expect(bounds.bottom).to.be.closeTo(trackBounds.bottom + 2, 0.1);
            expect(window.getComputedStyle(range).clipPath).to.contain('polygon(');
            expect(window.getComputedStyle(range.parentElement!).pointerEvents).to.equal('none');
        });
        cy.window().its('__STORYBOOK_PREVIEW__.channel').invoke('emit', 'updateStoryArgs', {
            storyId: 'forms-slider--gallery',
            updatedArgs: { ranges: [{ start: 25, end: 75 }] },
        });
        cy.get('@slider').find('[class*="range-tracks"] > div').should('have.length', 1).should(($range) => {
            const bounds = $range[0].getBoundingClientRect();
            const trackBounds = $range[0].parentElement!.getBoundingClientRect();
            expect(bounds.left - trackBounds.left).to.be.closeTo(trackBounds.width * 0.25, 0.1);
            expect(bounds.width).to.be.closeTo(trackBounds.width * 0.5, 0.1);
        });
    });

    it("uses opaque track shades and thumb interaction paints across variants and modes", () => {
        cy.visit("/iframe.html?id=forms-slider--gallery&viewMode=story");
        cy.get("#theme-appearance-variables").should("exist");
        cy.get('input[type="range"]').should("have.length", 24);
        cy.get<HTMLInputElement>(
            '.story [data-appearance-color="neutral"] input[type="range"]',
        )
            .should("have.length", 3)
            .each(($input) => {
                const input = $input[0] as HTMLInputElement;
                const slider = $input[0].closest("[data-appearance-variant]")!;
                const track = slider.querySelector('[aria-hidden="true"]')!;
                const progress = track.firstElementChild!;
                const thumb = track.lastElementChild!;
                const label = slider.querySelector("label")!;
                const window = slider.ownerDocument.defaultView!;
                const reference = slider.ownerDocument.createElement("span");
                slider.setAttribute("data-appearance-highlight", "hazard");
                slider.setAttribute("data-glow", "glow");
                slider.append(reference);
                for (const mode of ["light", "dark"]) {
                    slider.setAttribute("data-appearance-mode", mode);
                    reference.style.backgroundColor =
                        "var(--appearance-color-500)";
                    expect(
                        window.getComputedStyle(progress).backgroundColor,
                    ).to.equal(
                        window.getComputedStyle(reference).backgroundColor,
                    );
                    reference.style.backgroundColor = `var(--appearance-color-${mode === "light" ? 300 : 700})`;
                    expect(
                        window.getComputedStyle(track).backgroundColor,
                        `${slider.getAttribute("data-appearance-color")} ${slider.getAttribute("data-appearance-variant")} ${mode}`,
                    ).to.equal(
                        window.getComputedStyle(reference).backgroundColor,
                    );
                    expect(window.getComputedStyle(track).opacity).to.equal(
                        "1",
                    );
                    expect(window.getComputedStyle(progress).opacity).to.equal(
                        "1",
                    );
                    expect(window.getComputedStyle(thumb).boxShadow).to.equal(
                        "none",
                    );
                    const leftCap = window.getComputedStyle(
                        progress,
                        "::before",
                    );
                    const rightCap = window.getComputedStyle(track, "::after");
                    const trackThickness = parseFloat(
                        window.getComputedStyle(track).height,
                    );
                    for (const cap of [leftCap, rightCap]) {
                        expect(cap.content).not.to.equal("none");
                        expect(
                            parseFloat(cap.width) * Math.SQRT2,
                        ).to.be.closeTo(trackThickness, 0.02);
                        expect(cap.height).to.equal(cap.width);
                    }
                    expect(leftCap.backgroundColor).to.equal(
                        window.getComputedStyle(progress).backgroundColor,
                    );
                    expect(rightCap.backgroundColor).to.equal(
                        window.getComputedStyle(track).backgroundColor,
                    );
                    const unfilledColor =
                        window.getComputedStyle(track).backgroundColor;
                    expect(window.getComputedStyle(track).boxShadow).to.equal("none");
                    expect(parseFloat(window.getComputedStyle(thumb).width)).to.equal(parseFloat(window.getComputedStyle(slider).getPropertyValue("--size-control-thumb-size")));
                    const labelColor = window.getComputedStyle(label).color;
                    input.focus();
                    expect(input.matches(":focus-visible")).to.equal(true);
                    expect(window.getComputedStyle(track.parentElement!).outlineWidth).to.equal("2px");
                    for (const highlighted of [false, true]) {
                        if (highlighted) {
                            slider.setAttribute("data-highlighted", "true");
                        }
                        const thumbStyle = window.getComputedStyle(thumb);
                        const thumbPaint =
                            slider.getAttribute("data-appearance-variant") ===
                            "fill"
                                ? thumbStyle.backgroundColor
                                : thumbStyle.borderTopColor;
                        reference.style.backgroundColor = `var(--appearance-${highlighted ? "active-pressed" : "hover-focus"}-${slider.getAttribute("data-appearance-variant") === "fill" ? "surface" : "border"})`;
                        expect(thumbPaint).to.equal(window.getComputedStyle(reference).backgroundColor);
                        expect(
                            window.getComputedStyle(progress).backgroundColor,
                        ).to.equal(thumbPaint);
                        expect(
                            window.getComputedStyle(track).backgroundColor,
                        ).to.equal(unfilledColor);
                        expect(
                            window.getComputedStyle(thumb).boxShadow,
                        ).not.to.equal("none");
                        expect(
                            window.getComputedStyle(progress, "::before")
                                .backgroundColor,
                        ).to.equal(thumbPaint);
                        expect(
                            window.getComputedStyle(track, "::after")
                                .backgroundColor,
                        ).to.equal(unfilledColor);
                        expect(window.getComputedStyle(label).color).to.equal(
                            labelColor,
                        );
                    }
                    slider.setAttribute("data-disabled", "true");
                    input.disabled = true;
                    reference.style.backgroundColor = `var(--appearance-disabled-${slider.getAttribute("data-appearance-variant") === "fill" ? "surface" : "border"})`;
                    const disabledThumb = window.getComputedStyle(thumb);
                    expect(slider.getAttribute("data-appearance-variant") === "fill" ? disabledThumb.backgroundColor : disabledThumb.borderTopColor).to.equal(window.getComputedStyle(reference).backgroundColor);
                    expect(window.getComputedStyle(input).cursor).to.equal("not-allowed");
                    expect(window.getComputedStyle(slider).opacity).to.equal("1");
                    expect(window.getComputedStyle(track.parentElement!).outlineStyle).to.equal("none");
                    reference.style.backgroundColor =
                        "var(--appearance-color-500)";
                    expect(
                        window.getComputedStyle(progress).backgroundColor,
                    ).to.equal(
                        window.getComputedStyle(reference).backgroundColor,
                    );
                    expect(
                        window.getComputedStyle(track).backgroundColor,
                    ).to.equal(unfilledColor);
                    expect(window.getComputedStyle(thumb).boxShadow).to.equal(
                        "none",
                    );
                    slider.removeAttribute("data-disabled");
                    slider.removeAttribute("data-highlighted");
                    input.disabled = false;
                    input.blur();
                }
                reference.remove();
            });
    });

    it("runs the animated thumb glow once and resets it when inactive", () => {
        cy.visit("/iframe.html?id=forms-slider--gallery&viewMode=story");
        cy.get('input[type="range"]')
            .first()
            .closest("[data-appearance-variant]")
            .invoke("attr", "data-glow", "animate-borders-glow")
            .invoke("attr", "data-highlighted", "true")
            .then(async ($slider) => {
                const thumb = $slider[0].querySelector(
                    '[aria-hidden="true"]',
                )!.lastElementChild!;
                const animation = thumb.getAnimations()[0];
                expect(animation).to.exist;
                expect(animation.effect!.getTiming().iterations).to.equal(1);
                expect(animation.effect!.getTiming().duration).to.equal(400);
                await animation.finished;
                expect(animation.playState).to.equal("finished");
                const window = thumb.ownerDocument.defaultView!;
                expect(window.getComputedStyle(thumb).boxShadow).to.include(
                    "1px 1px 4px",
                );
                $slider[0].removeAttribute("data-highlighted");
                expect(thumb.getAnimations()).to.have.length(0);
                expect(window.getComputedStyle(thumb).boxShadow).to.equal(
                    "none",
                );
            });
    });

    it("keeps the range and extracted number/step controls synchronized", () => {
        cy.visit("/iframe.html?id=forms-slider--gallery&viewMode=story");
        cy.get('input[type="range"]').should("have.length", 24);
        cy.window()
            .its("__STORYBOOK_PREVIEW__.channel")
            .invoke("emit", "updateStoryArgs", {
                storyId: "forms-slider--gallery",
                updatedArgs: {
                    showNumberInput: true,
                    showStepControls: true,
                },
            });
        cy.get('input[type="range"]')
            .first()
            .closest("[data-appearance-variant]")
            .as("slider");
        cy.get("@slider")
            .find('input[type="number"]')
            .should("have.value", "50")
            .type("{selectall}75", { delay: 100 })
            .should("have.value", "75");
        cy.get("@slider")
            .find('input[type="range"]')
            .should("have.value", "75");
        cy.get("@slider").find('button[aria-label="Slider (+)"]').click();
        cy.get("@slider")
            .find('input[type="range"]')
            .should("have.value", "76");
        cy.get("@slider")
            .find('input[type="number"]')
            .should("have.value", "76");
    });
});
