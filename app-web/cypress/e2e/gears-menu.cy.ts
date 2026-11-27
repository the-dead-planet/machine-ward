describe("Gears menu", () => {
    it("animates the bar when the first notice arrives", () => {
        cy.viewport(900, 700);
        cy.visit("/", { onBeforeLoad: (window) => window.localStorage.clear() });
        cy.get('[data-testid="notices-toolbar"]').should(($toolbar) => {
            expect($toolbar[0].getBoundingClientRect().height).to.equal(1);
        });
        cy.get('[data-testid="notices-toolbar"]', { timeout: 15000 }).should(($toolbar) => {
            const height = $toolbar[0].getBoundingClientRect().height;
            expect(height).to.be.greaterThan(1);
            expect(height).to.be.lessThan(30);
        });
        cy.get('[data-testid="notices-toolbar"]', { timeout: 15000 }).should(($toolbar) => {
            expect($toolbar[0].getBoundingClientRect().height).to.equal(30);
        });
    });

    it("enters from the right and exits on the left at a steady rate", () => {
        cy.viewport(900, 700);
        cy.visit("/");
        cy.get('[data-testid="notices-toolbar"]', { timeout: 15000 }).should(($toolbar) => {
            expect($toolbar[0].getBoundingClientRect().height).to.equal(30);
        });
        cy.get('[data-testid="notice-ticker"]').as("ticker");
        cy.get("@ticker").should(($ticker) => {
            const ticker: HTMLElement = $ticker[0];
            const viewport = ticker.parentElement!;
            const [animation] = ticker.getAnimations();
            const duration = Number(animation.effect!.getTiming().duration);
            expect(duration / 1000).to.be.closeTo((viewport.clientWidth + ticker.scrollWidth) / 75, 0.5);
            animation.pause();
            animation.currentTime = 0;
            const start = ticker.getBoundingClientRect().left;
            expect(start).to.be.closeTo(viewport.getBoundingClientRect().right, 0.5);
            animation.currentTime = 1000;
            expect(start - ticker.getBoundingClientRect().left).to.be.closeTo(75, 0.5);
            animation.currentTime = duration - 1;
            expect(ticker.getBoundingClientRect().right).to.be.closeTo(viewport.getBoundingClientRect().left, 0.5);
        });
    });

    it("keeps notice counts beside the ticker and opens the notice reader", () => {
        cy.viewport(599, 700);
        cy.visit("/", { onBeforeLoad: (window) => window.localStorage.clear() });
        const summary = 'button[aria-label="Notices — Glitch: 2, Hazard: 1, Intel: 1"]';
        cy.get(summary, { timeout: 15000 }).should("be.visible");
        cy.get(summary).contains("span", /^2$/).should("have.css", "font-size", "12px").trigger("mouseover");
        cy.contains('[role="tooltip"]', "2 glitches").should("be.visible");
        cy.get('[data-testid="notice-ticker"]').parent().should(($viewport) => {
            const button = $viewport[0].parentElement!.querySelector(summary)!;
            expect(button.getBoundingClientRect().left).to.be.at.least($viewport[0].getBoundingClientRect().right);
        });
        cy.get(summary).click();
        cy.get('[data-testid="notice-popup"]').should("contain.text", "Could not post to the data base. Critical error")
            .and("contain.text", "Copied to clipboard!");
        cy.get('[data-testid="notice-popup"]').should(($popup) => {
            const button = $popup[0].ownerDocument.querySelector(summary)!;
            expect($popup[0].getBoundingClientRect().top).to.be.at.least(button.getBoundingClientRect().bottom);
        });
        cy.contains('[data-testid="notice-popup"] li', "Copied to clipboard!")
            .find('button[aria-label="Remove notice"]').click();
        cy.get('[data-testid="notice-popup"]').should("not.contain.text", "Copied to clipboard!");
        cy.get('nav h1').click();
        cy.get('[data-testid="notice-popup"]').should("not.exist");
        cy.get('button[aria-label="Notices — Glitch: 2, Hazard: 1"]')
            .should("have.attr", "aria-expanded", "false");
    });

    it("shows active shortcut hints on the map without opening the notices toolbar", () => {
        cy.viewport(1100, 800);
        cy.visit("/", { onBeforeLoad: (window) => window.localStorage.clear() });
        cy.get('span[role="button"][aria-label*="Image"]', { timeout: 20000 }).first()
            .focus()
            .trigger("keydown", { key: "Enter", force: true });
        const selectedMarker = 'span[role="button"][aria-label*="Image"][aria-pressed="true"]';
        cy.get(selectedMarker).should("exist");
        cy.get('[data-testid="map-guide-hints"]', { timeout: 15000 })
            .should("be.visible")
            .and("have.css", "pointer-events", "none")
            .find("li").should("have.length", 4);
        cy.contains('[data-testid="map-guide-hints"] li', "Move image backward along the route")
            .find("kbd").should("have.text", "←")
            .and("have.attr", "data-appearance-variant", "fill-inverse")
            .and("have.attr", "data-appearance-color", "neutral");
        cy.get('[data-testid="notice-ticker"]', { timeout: 15000 }).then(($ticker) => {
            $ticker[0].querySelectorAll<HTMLButtonElement>("button").forEach((button) => button.click());
        });
        cy.get('[data-testid="notice-ticker"]').should("not.exist");
        cy.get('[data-testid="notices-toolbar"]').should("have.css", "height", "0px");
        cy.get(selectedMarker).trigger("keydown", { key: " ", force: true });
        cy.get('[data-testid="map-guide-hints"]').should("not.exist");
    });

    it("keeps the top chrome compact and toggles the named gear without closing the menu", () => {
        cy.viewport(600, 700);
        cy.visit("/");
        const trigger = 'button[aria-label="Gears"]';
        const toggle = '[role="menuitemcheckbox"]';
        const controls = [
            trigger,
            'button[aria-label="Application menu"]',
            'button[aria-label^="Switch to "]',
            'span[data-appearance-color="hazard"]',
        ].join(', ');

        cy.get(trigger).closest("nav").should("have.css", "height", "50px");
        cy.document().then((document) => document.fonts.ready);
        cy.get(trigger).closest("nav").find("h1").should(($title) => {
            const title = $title[0];
            const bounds = title.getBoundingClientRect();
            expect($title).to.have.css("font-size", "14px");
            expect(bounds.left).to.be.at.least(title.previousElementSibling!.getBoundingClientRect().right);
            expect(bounds.right).to.be.at.most(title.nextElementSibling!.getBoundingClientRect().left);
        });
        cy.get(trigger).closest("nav").find(controls).should("have.length", 4).then(($wideControls) => {
            const wideHeights = $wideControls.toArray().map((control) => control.getBoundingClientRect().height);
            cy.viewport(599, 700);
            cy.get(trigger).closest("nav").find("h1").should("have.css", "font-size", "12px");
            cy.get(trigger).closest("nav").should("have.css", "height", "40px").find(controls).should(($compactControls) => {
                expect($compactControls).to.have.length(4);
                $compactControls.toArray().forEach((control, index) => {
                    expect(control.getBoundingClientRect().height).to.be.lessThan(wideHeights[index]);
                });
            });
        });
        cy.get(trigger).should("have.attr", "data-appearance-color", "secondary");
        cy.get(trigger).click();
        cy.get('[role="menu"]').should(($menu) => {
            const menu = $menu[0];
            expect(menu.scrollHeight).to.be.at.most(menu.clientHeight);
        });
        cy.get(toggle).first().should("be.focused");
        cy.contains('[role="menu"] label', "Route Story").as("routeStory");
        cy.get("@routeStory").should(($row) => {
            const [name, control] = $row.children('span').toArray();
            expect(getComputedStyle(name).textTransform).to.equal('none');
            expect(name.getBoundingClientRect().left).to.be.greaterThan(control.getBoundingClientRect().right);
        });
        cy.get("@routeStory").find(toggle).should("be.checked");
        const description = "Create a video story out of your GPS traces and image data";
        const info = `[role="menu"] [role="img"][aria-label="${description}"]`;
        cy.get(info).find('[data-appearance-color="secured"]').should("exist");
        cy.get(info).trigger("mouseover");
        cy.contains('[role="tooltip"]', description).should(($tooltip) => {
            const tooltip = $tooltip[0];
            const icon = tooltip.ownerDocument.querySelector(info)!;
            expect($tooltip).to.have.attr("data-appearance-color", "secured");
            expect(tooltip.getBoundingClientRect().left).to.be.at.least(icon.getBoundingClientRect().right);
        });
        cy.get(info).trigger("mouseout");
        cy.get("@routeStory").click();
        cy.get("@routeStory").find(toggle).should("not.be.checked");
        cy.get(info).find('[data-appearance-color="neutral"]').should("exist");
        cy.get("@routeStory").click();
        cy.get("@routeStory").find(toggle).should("be.checked").trigger("keydown", { key: "Escape", force: true });
        cy.get(trigger).should("be.focused").and("have.attr", "aria-expanded", "false");
    });
});
