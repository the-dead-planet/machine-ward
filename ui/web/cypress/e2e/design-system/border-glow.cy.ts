describe("Animated border glow", () => {
    const storyId = "gizmos-button--playground";
    const update = (updatedArgs: Record<string, unknown>) =>
        cy.window().its("__STORYBOOK_PREVIEW__.channel").invoke("emit", "updateStoryArgs", { storyId, updatedArgs });

    for (const corners of ["square", "circle", "hexagon"]) {
        it(`${corners} runs once, retains the final glow, resets, and suppresses disabled animation`, () => {
            cy.visit(
                `/iframe.html?id=${storyId}&viewMode=story&args=corners:${corners};children:;activeGlow:animate-borders-glow`,
            );
            cy.get(".story button").should("exist");
            update({ corners, children: "", activeGlow: "animate-borders-glow", highlighted: false, disabled: false });
            cy.get(".story button").should("have.attr", "data-glow", "animate-borders-glow");
            update({ highlighted: true });
            cy.get(".story button")
                .should(($button) => {
                    expect($button[0].getAnimations({ subtree: true })).not.to.be.empty;
                })
                .then(async ($button) => {
                    const animations = $button[0].getAnimations({ subtree: true });
                    for (const animation of animations) {
                        expect(animation.effect!.getTiming()).to.include({
                            iterations: 1,
                            duration: corners === "hexagon" ? 300 : 400,
                            fill: "forwards",
                        });
                        await animation.finished;
                        expect(animation.playState).to.equal("finished");
                    }
                });
            cy.get(".story button").should(($button) => {
                const button = $button[0];
                const window = button.ownerDocument.defaultView!;
                if (corners === "hexagon") {
                    const glow = window.getComputedStyle(button.querySelector('[class*="polygon-glow"]')!);
                    expect(glow.opacity).to.equal("1");
                    expect(glow.strokeDasharray.replaceAll(" ", "")).to.equal("300px,0px");
                } else {
                    const glow = window.getComputedStyle(button, "::after");
                    expect(glow.boxShadow).to.include("1px 1px 4px");
                    expect(glow.borderRadius).to.equal(corners === "circle" ? "50%" : "0px");
                }
            });
            update({ highlighted: false });
            cy.get(".story button").should(($button) =>
                expect($button[0].getAnimations({ subtree: true })).to.have.length(0),
            );
            update({ highlighted: true, disabled: true });
            cy.get(".story button")
                .should("be.disabled")
                .should(($button) => expect($button[0].getAnimations({ subtree: true })).to.have.length(0));
            if (corners === "hexagon") {
                cy.get('.story [class*="polygon-glow"]').should("have.css", "opacity", "0");
            }
        });
    }

    if (Cypress.isBrowser({ family: "chromium" })) {
        afterEach(() =>
            cy.then(() =>
                Cypress.automation("remote:debugger:protocol", {
                    command: "Emulation.setEmulatedMedia",
                    params: { features: [] },
                }),
            ),
        );

        for (const corners of ["square", "hexagon"]) {
            it(`${corners} honors the browser's reduced-motion preference`, () => {
                cy.then(() =>
                    Cypress.automation("remote:debugger:protocol", {
                        command: "Emulation.setEmulatedMedia",
                        params: { features: [{ name: "prefers-reduced-motion", value: "reduce" }] },
                    }),
                );
                cy.visit(
                    `/iframe.html?id=${storyId}&viewMode=story&args=corners:${corners};children:;activeGlow:animate-borders-glow;highlighted:true`,
                );
                cy.get(".story button").should("exist");
                update({
                    corners,
                    children: "",
                    activeGlow: "animate-borders-glow",
                    highlighted: true,
                    disabled: false,
                });
                cy.get(".story button")
                    .should("have.attr", "data-highlighted", "true")
                    .and("have.attr", "data-glow", "animate-borders-glow");
                cy.window().should((window) =>
                    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).to.equal(true),
                );
                cy.get(".story button").should(($button) => {
                    const button = $button[0];
                    const window = button.ownerDocument.defaultView!;
                    expect(button.getAnimations({ subtree: true })).to.have.length(0);
                    if (corners === "hexagon") {
                        const glow = window.getComputedStyle(button.querySelector('[class*="polygon-glow"]')!);
                        expect(glow.animationName).to.equal("none");
                        expect(glow.strokeDasharray).to.equal("none");
                        expect(glow.opacity).to.equal("1");
                    } else {
                        expect(window.getComputedStyle(button, "::after").boxShadow).not.to.equal("none");
                    }
                });
            });
        }
    }
});
