describe("Keycap Gallery", () => {
    it("renders and toggles the shared highlight from a gallery cell", () => {
        cy.visit("/iframe.html?id=gizmos-keycap--gallery&viewMode=story");
        const outline = 'button[aria-label="Highlight primary outline keycap"]';
        const fill = 'button[aria-label="Highlight intel fill keycap"]';

        cy.get(outline).find("kbd").should("have.text", "Ctrl")
            .and("have.css", "height", "20px");
        cy.get(fill).should("have.attr", "aria-pressed", "false");
        cy.get(outline).click();
        cy.get(fill).find("kbd").should("have.attr", "data-highlighted", "true");
        cy.get(fill).click();
        cy.get(outline).find("kbd").should("not.have.attr", "data-highlighted");
    });
});
