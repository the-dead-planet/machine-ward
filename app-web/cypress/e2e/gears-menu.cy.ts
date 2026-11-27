describe("Gears menu", () => {
    it("enters from the right and exits on the left at a steady rate", () => {
        cy.viewport(900, 700);
        cy.visit("/");
        cy.get('button[aria-label="Gears"]').closest("nav").next()
            .children().first().children().first().children().first().as("ticker");
        cy.get("@ticker").then(($ticker) => {
            const ticker: HTMLElement = $ticker[0];
            ticker.append(ticker.ownerDocument.createTextNode("Ticker test message"));
        });
        cy.get("@ticker").should(($ticker) => {
            const ticker: HTMLElement = $ticker[0];
            const viewport = ticker.parentElement!;
            const [animation] = ticker.getAnimations();
            const duration = Number(animation.effect!.getTiming().duration);
            expect(duration / 1000).to.be.closeTo((viewport.clientWidth + ticker.offsetWidth) / 15, 0.1);
            animation.pause();
            animation.currentTime = 0;
            const start = ticker.getBoundingClientRect().left;
            expect(start).to.be.closeTo(viewport.getBoundingClientRect().right, 0.5);
            animation.currentTime = 1000;
            expect(start - ticker.getBoundingClientRect().left).to.be.closeTo(15, 0.5);
            animation.currentTime = duration - 1;
            expect(ticker.getBoundingClientRect().right).to.be.closeTo(viewport.getBoundingClientRect().left, 0.5);
        });
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
        cy.get(trigger).closest("nav").next().children().first().as("noticesToolbar");
        cy.get("@noticesToolbar").should("have.css", "height", "30px");
        cy.get("@noticesToolbar").then(($toolbar) => {
            $toolbar[0].querySelectorAll("button").forEach((button: HTMLButtonElement) => button.click());
        });
        cy.get("@noticesToolbar").should("have.css", "height", "30px")
            .children().first().should("have.css", "border-bottom-width", "1px");
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
        cy.get("@routeStory").click();
        cy.get("@routeStory").find(toggle).should("not.be.checked");
        cy.get("@routeStory").click();
        cy.get("@routeStory").find(toggle).should("be.checked").trigger("keydown", { key: "Escape", force: true });
        cy.get(trigger).should("be.focused").and("have.attr", "aria-expanded", "false");
    });
});
