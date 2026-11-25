describe("Keyboard shortcut overview", () => {
    const shortcutRows = '[role="dialog"] tbody tr:has(th[scope="row"])';
    beforeEach(() => {
        cy.visit("/", {
            onBeforeLoad: (window) => {
                window.localStorage.clear();
                window.localStorage.setItem("cartomancer:map-style", JSON.stringify({ id: "background" }));
            },
        });
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 }).should("exist");
    });

    it("lists registered shortcuts after Individuator in a responsive, read-only dialog", () => {
        cy.get('span[role="button"][aria-pressed="true"]').should("not.exist");
        cy.get('button[aria-label="Application menu"]').click();
        cy.get('[role="menu"] [role^="menuitem"]').eq(1)
            .should("contain.text", "Keyboard shortcuts").click();
        cy.get('[role="dialog"]').should("be.visible");
        cy.get('[role="dialog"] h3').should("have.text", "Keysmith");
        cy.contains('[role="dialog"] p', /^Keyboard shortcuts$/).should("be.visible");
        cy.get('[role="dialog"] thead th', { timeout: 20000 }).should("have.length", 4);
        cy.get('[role="dialog"] thead th').last().should("have.text", "Status");
        cy.get('[role="dialog"] thead').should("have.css", "position", "absolute")
            .and("not.have.attr", "aria-hidden");
        cy.get(shortcutRows).should("have.length", 4);
        cy.get('[role="dialog"] tbody th[scope="rowgroup"]').should("have.length", 1).and("have.text", "Route Story");
        cy.get(shortcutRows).first().find('td:last-child [role="img"][aria-label="Available"]').focus();
        cy.get('[role="tooltip"]').should("be.visible")
            .and("have.text", "Available - To make this shortcut unavailable, hide image markers on both the map and the player.");
        cy.contains(shortcutRows, "Move image backward along the route")
            .within(() => {
                cy.get("kbd").should("have.text", "←");
                cy.contains("td", "1 metre").children().should(($lines) => {
                    expect($lines.eq(0)).to.have.text("Select a marker on the map or in the player");
                    expect($lines.eq(1)).to.contain.text("1 metre").and.to.contain.text("1 second");
                });
            });
        cy.contains(shortcutRows, "Move image forward by 1%")
            .should("contain.text", "1% of the route distance or timeline duration")
            .and("not.contain.text", "+")
            .find("kbd").should(($keys) => {
                expect($keys.toArray().map((key) => key.textContent)).to.deep.equal(["Ctrl", "→"]);
            });
        for (const [width, height] of [[1100, 844], [600, 992], [390, 844]]) {
            cy.viewport(width, height);
            cy.get('[role="dialog"]').should(($dialog) => {
                const heading = $dialog[0].querySelector('h3')!;
                expect(heading.parentElement!.getBoundingClientRect().left).to.be.at.least(0);
            });
            cy.get('[role="dialog"] section').should(($section) => {
                const bounds = $section[0].getBoundingClientRect();
                expect(bounds.left).to.be.at.least(0);
                expect(bounds.right).to.be.at.most(width);
            });
            cy.get(shortcutRows).each(($row) => {
                expect($row.children()).to.have.length(4);
                const keyLinePositions = $row.find('kbd').toArray().map((key) => key.getBoundingClientRect().top);
                expect(new Set(keyLinePositions).size, 'keys stay on one line').to.equal(1);
            });
        }
        const filterDropdown = '[role="dialog"] button[aria-label="Filter by key"]';
        cy.get(filterDropdown).click();
        cy.get('[role="listbox"] [role="option"]').should(($options) => {
            expect($options.toArray().map((option) => option.textContent?.trim()))
                .to.have.members(["All keys (4/4)", "← (2/4)", "→ (2/4)", "Ctrl (2/4)"]);
        });
        cy.contains('[role="listbox"] [role="option"]', "Ctrl (2/4)").click();
        cy.get(filterDropdown).should("contain.text", "Ctrl (2/4)");
        cy.get(shortcutRows).should("have.length", 2).and("contain.text", "Move image forward by 1%");
        cy.get(filterDropdown).click();
        cy.contains('[role="listbox"] [role="option"]', "← (2/4)").click();
        cy.get(shortcutRows).should("have.length", 2).find('kbd').filter((_, key) => key.textContent === "←")
            .should("have.length", 2);
        cy.get(filterDropdown).click();
        cy.contains('[role="listbox"] [role="option"]', "All keys (4/4)").click();
        cy.get(shortcutRows).should("have.length", 4);
        cy.contains('[role="dialog"] button', /^Close$/).click();
        cy.get('[role="dialog"]').should("not.exist");
    });

    it("stops handling shortcuts after they are disabled in Individuator", () => {
        cy.viewport(1100, 844);
        cy.get('span[role="button"][aria-label*="Image"]').first().focus()
            .trigger("keydown", { key: "Enter", force: true })
            .should("have.attr", "aria-pressed", "true");
        const pressShortcut = (handled: boolean) => {
            cy.document().then((document) => {
                const event = new document.defaultView!.KeyboardEvent("keydown", {
                    key: "ArrowLeft",
                    ctrlKey: true,
                    bubbles: true,
                    cancelable: true,
                });
                document.body.dispatchEvent(event);
                expect(event.defaultPrevented).to.equal(handled);
            });
        };
        const openSettings = () => {
            cy.get('button[aria-label="Application menu"]').click();
            cy.get('[role="menu"] [role^="menuitem"]').first().click();
            return cy.get('input[aria-labelledby="individuator-enable-keyboard-shortcuts-label"]');
        };
        pressShortcut(true);
        openSettings().should("be.checked").uncheck({ force: true });
        cy.contains('[role="dialog"] button', /^Save$/).click();
        cy.get('[role="dialog"]').should("not.exist");
        pressShortcut(false);
        cy.reload();
        openSettings().should("not.be.checked");
    });

    it("keeps marker shortcuts inactive while using the overview dialog", () => {
        cy.get('span[role="button"][aria-label*="Image"]').first().focus()
            .trigger("keydown", { key: "Enter", force: true })
            .should("have.attr", "aria-pressed", "true");
        cy.get('span[role="button"][aria-pressed="true"]').then(($marker) => {
            const before = $marker.parent()[0].style.left;
            cy.get('button[aria-label="Application menu"]').click();
            cy.contains('[role="menu"] [role^="menuitem"]', "Keyboard shortcuts").click();
            cy.get('[role="dialog"] section', { timeout: 20000 }).focus()
                .trigger("keydown", { key: "ArrowRight", ctrlKey: true });
            cy.get(shortcutRows).first().find('td:last-child [role="img"][aria-label="Available"]').should("be.visible");
            cy.get('span[role="button"][aria-pressed="true"]').should(($selected) => {
                expect($selected.parent()[0].style.left).to.equal(before);
            });
            cy.get('[role="dialog"]').trigger("keydown", { key: "Escape" });
            cy.get('[role="dialog"]').should("not.exist");
            cy.get('button[aria-label="Hide image layer"]').click();
            cy.get('button[aria-label="Hide image markers"]').click();
            cy.get('button[aria-label="Application menu"]').click();
            cy.contains('[role="menu"] [role^="menuitem"]', "Keyboard shortcuts").click();
            cy.get(shortcutRows).first().find('[aria-disabled="true"]').should("have.length", 1)
                .find("kbd").should("exist");
            cy.get(shortcutRows).first().find('td:last-child [role="img"][aria-label="Not available"]').focus();
            cy.get('[role="tooltip"]').should("be.visible")
                .and("have.text", "Not available - To make this shortcut available, show image markers on the map or in the open player.");
            cy.contains('[role="dialog"] button', /^Close$/).click();
            cy.get('[role="dialog"]').should("not.exist");
            cy.get('button[aria-label="Show image markers"]').click();
            cy.get('span[role="button"][aria-label*="Image"]').should("exist");
            cy.get('button[aria-label="Route Story"]').should("have.attr", "data-highlighted", "true");
            cy.get('button[aria-label="Route Story"]').click();
            cy.get('button[aria-label="Route Story"]').should("not.have.attr", "data-highlighted");
            cy.get('button[aria-label="Application menu"]').click();
            cy.contains('[role="menu"] [role^="menuitem"]', "Keyboard shortcuts").click();
            cy.get(shortcutRows).should("not.exist");
            cy.get('[role="dialog"] [role="status"]').should("have.text", "No keyboard shortcuts are currently registered.");
            cy.contains('[role="dialog"] button', /^Close$/).click();
            cy.get('[role="dialog"]').should("not.exist");
            cy.get('button[aria-label="Route Story"]').click();
            cy.get('button[aria-label="Application menu"]').click();
            cy.contains('[role="menu"] [role^="menuitem"]', "Keyboard shortcuts").click();
            cy.get(shortcutRows).should("have.length", 4);
        });
    });
});
