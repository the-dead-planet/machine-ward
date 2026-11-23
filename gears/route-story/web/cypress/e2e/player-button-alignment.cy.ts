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
            .trigger("keydown", { key: "Enter", force: true });
        cy.get('span[role="button"][aria-label*="Image"]').first().should("have.attr", "aria-pressed", "true");
        cy.get('span[role="button"][aria-label*="Image"]').first().should(($marker) => {
            const marker = $marker[0];
            const view = marker.ownerDocument.defaultView!;
            const paint = marker.ownerDocument.createElement("span");
            marker.append(paint);
            try {
                paint.style.color = "var(--color-tertiary-800)";
                expect(view.getComputedStyle(marker).backgroundColor).to.equal(view.getComputedStyle(paint).color);
                expect(view.getComputedStyle(marker, "::after").backgroundColor).to.equal(view.getComputedStyle(paint).color);
                paint.style.color = "var(--color-tertiary-500)";
                expect(view.getComputedStyle(marker).borderLeftColor).to.equal(view.getComputedStyle(paint).color);
                expect(view.getComputedStyle(marker, "::after").borderColor).to.equal(view.getComputedStyle(paint).color);
            } finally {
                paint.remove();
            }
        });
        cy.get('input[aria-label="Slider"]').focus();
        cy.get('span[role="button"][aria-pressed="true"]').siblings('span')
            .should("be.visible")
            .invoke("text").should("match", /^\d+% · .* (km|mi)/);
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .trigger("keydown", { key: " ", force: true });
        cy.get('span[role="button"][aria-label*="Image"]').first().should("have.attr", "aria-pressed", "false");
        cy.get('span[role="button"][aria-label*="Image"]').first().siblings('span').should("not.exist");
    });

    it("releases focus on pointer deselection but keeps it on keyboard deselection", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 }).first().then(($marker) => {
            cy.stub($marker[0], "setPointerCapture");
        });
        cy.get('span[role="button"][aria-label*="Image"]').first().click("bottom")
            .should("have.attr", "aria-pressed", "true")
            .and("be.focused");
        cy.get('span[role="button"][aria-label*="Image"]').first().click("bottom")
            .should("have.attr", "aria-pressed", "false")
            .and("not.be.focused");
        cy.get('span[role="button"][aria-label*="Image"]').first().trigger("mouseout")
            .siblings('span').should("not.exist");
        cy.get('span[role="button"][aria-label*="Image"]').first().focus()
            .trigger("keydown", { key: "Enter", force: true })
            .should("have.attr", "aria-pressed", "true")
            .trigger("keydown", { key: " ", force: true })
            .should("have.attr", "aria-pressed", "false")
            .and("be.focused");
    });

    it("moves the selected marker with arrows without using the focused element or the slider", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 })
            .filter((_index, marker) => parseFloat(marker.parentElement!.style.left) < 90)
            .should("have.length.at.least", 1)
            .first().focus()
            .trigger("keydown", { key: "Enter", force: true }).blur()
            .should("have.attr", "aria-pressed", "true");
        cy.get('span[role="button"][aria-pressed="true"]').then(($marker) => {
            const before = parseFloat($marker.parent()[0].style.left);
            cy.get('input[aria-label="Slider"]').invoke("val").then((sliderValue) => {
                cy.get("body").trigger("keydown", { key: "ArrowRight", ctrlKey: true });
                cy.get('span[role="button"][aria-pressed="true"]').should($current => {
                    expect(parseFloat($current.parent()[0].style.left)).to.be.closeTo(before + 1, 0.001);
                }).then(($current) => {
                    const afterRight = parseFloat($current.parent()[0].style.left);
                    cy.get("body").trigger("keydown", { key: "ArrowLeft" });
                    cy.get('span[role="button"][aria-pressed="true"]').should($afterLeft => {
                        expect(parseFloat($afterLeft.parent()[0].style.left)).to.be.lessThan(afterRight);
                    });
                });
                cy.get('span[role="button"][aria-pressed="true"]').then(($selected) => {
                    const beforeHidden = parseFloat($selected.parent()[0].style.left);
                    cy.get('button[aria-label="Hide image markers"]').click();
                    cy.get('span[role="button"][aria-label*="Image"]').should("not.exist");
                    cy.get("canvas.maplibregl-canvas").focus().trigger("keydown", { key: "ArrowRight", ctrlKey: true });
                    cy.get('button[aria-label="Show image markers"]').click();
                    cy.get('span[role="button"][aria-pressed="true"]').should($visible => {
                        expect(parseFloat($visible.parent()[0].style.left)).to.be.closeTo(beforeHidden + 1, 0.001);
                    });
                });
                cy.get('input[aria-label="Slider"]').invoke("val").should("equal", sliderValue);
            });
        });
    });

    it("leaves native inputs and the real color picker in control of their arrows", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 }).first()
            .focus()
            .trigger("keydown", { key: "Enter", force: true })
            .should("have.attr", "aria-pressed", "true")
            .then(($marker) => {
                const before = $marker.parent()[0].style.left;
                cy.get('input[aria-label="Slider"]').focus()
                    .trigger("keydown", { key: "ArrowRight", ctrlKey: true });
                cy.get('span[role="button"][aria-pressed="true"]').should($selected => {
                    expect($selected.parent()[0].style.left).to.equal(before);
                });
                cy.get('button[aria-label="Open layer aesthetic options"]').click();
                cy.get('[role="dialog"] button[aria-label^="Color:"]').first().click();
                cy.get('[role="slider"][aria-label$="saturation and brightness"]').focus()
                    .then(($ramp) => {
                        const saturation = Number($ramp.attr("aria-valuenow"));
                        cy.wrap($ramp).trigger("keydown", { key: saturation > 0 ? "ArrowLeft" : "ArrowRight" });
                        cy.get('[role="slider"][aria-label$="saturation and brightness"]').should($updated => {
                            expect(Number($updated.attr("aria-valuenow"))).not.to.equal(saturation);
                        });
                    });
                cy.get('span[role="button"][aria-pressed="true"]').should($selected => {
                    expect($selected.parent()[0].style.left).to.equal(before);
                });
            });
    });

    it("keeps markers behind the slider while their exposed thumbs remain interactive", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 })
            .first()
            .should(($marker) => {
                const marker = $marker[0];
                const bounds = marker.getBoundingClientRect();
                const range = marker.ownerDocument.querySelector('input[aria-label="Slider"]')!;
                const track = range.getBoundingClientRect();
                const centerX = bounds.left + bounds.width / 2;
                expect(marker.ownerDocument.elementFromPoint(centerX, track.top + track.height / 2), "the slider receives pointers at the crossing").to.equal(range);
                expect(marker.ownerDocument.elementFromPoint(centerX, bounds.bottom - 4), "the marker thumb remains reachable below the slider").to.equal(marker);
            });
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .trigger("mouseover", "bottom", { waitForAnimations: false });
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .invoke("attr", "class").should("match", /highlight/);
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .siblings('span').should(($readout) => {
                expect($readout.text()).to.match(/^\d+% · .* (km|mi)/);
                const readout = $readout[0].getBoundingClientRect();
                const icon = $readout[0].parentElement!.querySelector("button")!.getBoundingClientRect();
                expect(Math.abs(readout.left + readout.width / 2 - icon.left - icon.width / 2)).to.be.lessThan(1);
                expect(readout.bottom).to.be.at.most(icon.top);
            });
        cy.get('[role="tooltip"]').should("not.exist");
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .trigger("mouseout", "bottom", { waitForAnimations: false });
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .invoke("attr", "class").should("not.match", /highlight/);
        cy.get('span[role="button"][aria-label*="Image"]').first().siblings('span').should("not.exist");
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
            cy.wrap($marker).trigger("pointerdown", "bottom", { button: 0, clientX: marker.left, clientY: marker.bottom - 4 });
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
        cy.get('input[aria-label="Slider"]').should("have.css", "cursor", "grabbing");
        cy.get("body").trigger("pointercancel");
        cy.get('[inert] > span').should("not.exist");
        cy.get('input[aria-label="Slider"]').should("have.css", "cursor", "pointer");
    });

    it("highlights the linked marker while its pan-to icon is hovered or focused", () => {
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 }).first().parent()
            .find('button[aria-label="Pan to image"]').as("panIcon");
        cy.get("@panIcon").trigger("mouseover");
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .should("have.attr", "aria-pressed", "false")
            .invoke("attr", "class").should("match", /highlight/);
        cy.get("@panIcon").trigger("mouseout");
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .invoke("attr", "class").should("not.match", /highlight/);
        cy.get("@panIcon").focus();
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .invoke("attr", "class").should("match", /highlight/);
        cy.get("@panIcon").blur();
        cy.get('span[role="button"][aria-label*="Image"]').first()
            .invoke("attr", "class").should("not.match", /highlight/);
    });
});
