describe("Route player alignment", () => {
    beforeEach(() => {
        cy.visit("/", { onBeforeLoad: (window) => window.localStorage.clear() });
        cy.get('button[aria-label="Play"]', { timeout: 20000 }).should("be.visible");
    });

    it("aligns the real wide-layout slider track with the Play/Pause icon center", () => {
        cy.viewport(1100, 800);
        cy.get('input[aria-label="Slider"]')
            .siblings('[aria-hidden="true"]')
            .should(($track) => {
                const track = $track[0].getBoundingClientRect();
                const play = $track[0].ownerDocument
                    .querySelector('button[aria-label="Play"] [data-appearance-glyph]')!
                    .getBoundingClientRect();
                expect(Math.abs(track.top + track.height / 2 - play.top - play.height / 2)).to.be.lessThan(1);
            });
    });

    it("keeps real Play/Pause and recording controls centered without overlap on narrow screens", () => {
        cy.get('button[aria-label="Application menu"]').click();
        cy.get('[role="menu"] [role^="menuitem"]').first().click();
        cy.get('input[aria-labelledby="individuator-debug-mode-label"]').check({ force: true });
        cy.get('[role="dialog"]')
            .contains("button", /^Save$/)
            .click();
        for (const width of [320, 600]) {
            cy.viewport(width, 640);
            cy.get('button[aria-label="Play"]').should(($play) => {
                const button = $play[0];
                const play = button.getBoundingClientRect();
                const row = button.parentElement!.getBoundingClientRect();
                expect(Math.abs(play.left + play.width / 2 - row.left - row.width / 2)).to.be.lessThan(1);
                const recordingIcons = button.previousElementSibling!.querySelectorAll("[data-appearance-glyph]");
                expect(recordingIcons.length).to.equal(3);
                for (const icon of recordingIcons) {
                    const bounds = icon.getBoundingClientRect();
                    expect(bounds.right).to.be.at.most(play.left);
                    expect(Math.abs(bounds.top + bounds.height / 2 - play.top - play.height / 2)).to.be.lessThan(1);
                }
            });
        }
    });

    it("keeps extracted slider markers keyboard-selectable", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 }).first()
            .focus()
            .trigger("keydown", { key: "Enter" });
        cy.get('span[role="button"][aria-label*="Image"]').first().should("have.attr", "aria-pressed", "true");
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .trigger("keydown", { key: " " });
        cy.get('span[role="button"][aria-label*="Image"]').first().should("have.attr", "aria-pressed", "false");
    });

    it("keeps slider markers above the range input so pointer hover reaches them", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 })
            .first()
            .should("be.visible");
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .trigger("mouseover", { waitForAnimations: false });
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .invoke("attr", "class").should("match", /highlight/);
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .trigger("mouseout", { waitForAnimations: false });
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .invoke("attr", "class").should("not.match", /highlight/);
        cy.get('input[aria-label="Slider"]').should(($range) => {
            const input = $range[0];
            const bounds = input.getBoundingClientRect();
            const hasReachableTrack = Array.from({ length: 9 }, (_, index) => (index + 1) / 10)
                .some((fraction) => input.ownerDocument.elementFromPoint(bounds.left + bounds.width * fraction, bounds.top + bounds.height / 2) === input);
            expect(hasReachableTrack, "the range remains pointer-accessible between markers").to.equal(true);
        });
    });

    it("centers the live drag readout above the pan-to icon and removes it on cancellation", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 }).first().then(($marker) => {
            const marker = $marker[0].getBoundingClientRect();
            const track = $marker[0].parentElement!.parentElement!.getBoundingClientRect();
            cy.stub($marker[0], "setPointerCapture");
            cy.wrap($marker).trigger("pointerdown", { button: 0, clientX: marker.left, clientY: marker.top });
            cy.get("body").trigger("pointermove", { clientX: marker.left - 10, clientY: marker.top });
            cy.get("body").trigger("pointermove", { clientX: track.left + track.width / 2, clientY: marker.top });
        });
        cy.get('[inert] > span').first().should(($readout) => {
            expect($readout.text()).to.match(/^50% · /);
            const readout = $readout[0].getBoundingClientRect();
            const icon = $readout[0].parentElement!.querySelector("button")!.getBoundingClientRect();
            expect(Math.abs(readout.left + readout.width / 2 - icon.left - icon.width / 2)).to.be.lessThan(1);
            expect(readout.bottom).to.be.at.most(icon.top);
        });
        cy.get("body").trigger("pointercancel");
        cy.get('[inert] > span').should("not.exist");
    });
});
