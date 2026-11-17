describe("Side tool panel scrolling", () => {
    it("keeps the real panel headers stationary, reaches the last control, and stops overflowing after filtering", () => {
        cy.viewport(1100, 360);
        cy.visit("/", { onBeforeLoad: (window) => window.localStorage.clear() });
        cy.get('button[aria-label="Animatrix controls"]', { timeout: 20000 }).then(($button) => {
            if ($button.attr("data-highlighted") !== "true") {
                cy.wrap($button).click();
            }
        });
        for (const placement of ["left", "right"]) {
            cy.get("#animation-controls-search")
                .should("be.visible")
                .parents()
                .filter((_index, element) => Boolean(element.nextElementSibling?.querySelector("fieldset")))
                .should("have.length", 1)
                .as("header");
            cy.get("@header").next().as("scroll");
            cy.get("@header").parent().prev().as("rail");
            cy.get("@header").parent().parent().parent().as("panel");
            cy.get("@panel").should(($panel) => {
                const bounds = $panel[0].getBoundingClientRect();
                expect(bounds.left + bounds.width / 2).to.satisfy((center: number) =>
                    placement === "left" ? center < 550 : center > 550,
                );
            });
            for (const height of [360, 240]) {
                cy.viewport(1100, height);
                cy.get<JQuery<HTMLElement>>("@scroll").should(($content) => {
                    const content = $content[0];
                    const bounds = content.getBoundingClientRect();
                    const header = content.previousElementSibling!;
                    expect(bounds.bottom).to.be.at.most(height);
                    expect(bounds.top).to.be.at.least(header.getBoundingClientRect().bottom);
                    expect(content.clientHeight).to.be.greaterThan(0);
                    expect(content.scrollHeight).to.be.greaterThan(content.clientHeight);
                });
            }
            cy.get("#animation-controls-search").then(($search) => {
                const headerTop = $search[0].getBoundingClientRect().top;
                cy.get("@rail").then(($rail) => {
                    const railTop = $rail[0].getBoundingClientRect().top;
                    cy.get("@scroll").scrollTo("bottom").find("button, label").last().should("be.visible");
                    cy.get("#animation-controls-search").should(($current) =>
                        expect($current[0].getBoundingClientRect().top).to.equal(headerTop),
                    );
                    cy.get("@rail").should(($current) =>
                        expect($current[0].getBoundingClientRect().top).to.equal(railTop),
                    );
                });
            });
            cy.get("@header")
                .parent()
                .parent()
                .should(($container) => expect($container[0].scrollTop).to.equal(0));
            cy.get("#animation-controls-search").focus().type("no matching control");
            cy.get<JQuery<HTMLElement>>("@scroll").should(($content) =>
                expect($content[0].scrollHeight).to.equal($content[0].clientHeight),
            );
            cy.get("#animation-controls-search").clear();
            if (placement === "left") {
                cy.get("@panel").find('button[aria-label="Panel options"]').click();
                cy.contains('[role="menuitem"]', "Place panel on the right").click();
            }
        }
    });
});
