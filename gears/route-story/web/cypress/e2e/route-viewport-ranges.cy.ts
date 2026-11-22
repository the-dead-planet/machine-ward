describe("Route viewport ranges", () => {
    it("marks partial visibility after panning to an image independently of image-marker visibility", () => {
        cy.visit("/", {
            onBeforeLoad: (window) => {
                window.localStorage.clear();
                window.localStorage.setItem("cartomancer:map-style", JSON.stringify({ id: "background" }));
                const matchMedia = window.matchMedia.bind(window);
                cy.stub(window, "matchMedia").callsFake((query: string) => {
                    const media = matchMedia(query);
                    if (query.includes("prefers-reduced-motion")) {
                        Object.defineProperty(media, "matches", { value: true });
                    }
                    return media;
                });
            },
        });
        cy.get('button[aria-label="Pan to image"]', { timeout: 20000 }).first().should("exist");
        // Initial route setup restores the camera after one second.
        cy.wait(1100);
        cy.get('button[aria-label="Pan to image"]').first().click({ force: true });
        cy.get('input[aria-label="Slider"]').siblings('[class*="range-tracks"]').children({ timeout: 20000 }).should("have.length.at.least", 1);
        cy.get('button[aria-label="Hide image markers"]').click();
        cy.get('span[role="button"][aria-label*="Image"]').should("not.exist");
        cy.window().should((window) => {
            const state: { markerPlayerVisibility: boolean; viewportRangePlayerVisibility: boolean } = JSON.parse(window.localStorage.getItem("route-story:state")!);
            expect(state.markerPlayerVisibility).to.equal(false);
            expect(state.viewportRangePlayerVisibility).to.equal(true);
        });
    });
});
