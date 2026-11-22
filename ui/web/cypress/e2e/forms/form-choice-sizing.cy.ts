import { themeSizes } from "@the-dead-planet/machine-ward-ui-common/src/design-system/theme/tinkers";
import { cornerOptions } from "@the-dead-planet/machine-ward-ui-common/src/design-system/tinkers";

describe("Form choice row sizing", () => {
    for (const control of ["checkbox", "radio"]) {
        it(`keeps the real ${control} row stable when its selection mark appears`, () => {
            const storyId = `forms-${control}--playground`;
            const input = `.story input[type="${control}"]`;
            cy.visit(`/iframe.html?id=${storyId}&viewMode=story`);
            cy.get(input).should("exist");
            for (const [size, metrics] of Object.entries(themeSizes.control)) {
                for (const corners of cornerOptions) {
                    for (const children of ["", "Choice"]) {
                        cy.window()
                            .its("__STORYBOOK_PREVIEW__.channel")
                            .invoke("emit", "updateStoryArgs", {
                                storyId,
                                updatedArgs: { size, corners, children, checked: false },
                            });
                        cy.get(input).should("not.be.checked").closest("label").should("have.attr", "data-size", size);
                        cy.get(input)
                            .closest("label")
                            .should(($label) => {
                                const label = $label[0];
                                const box = label.querySelector('[aria-hidden="true"]')!;
                                expect(label.textContent).to.equal(children);
                                expect(box.querySelector("svg") !== null).to.equal(corners === "hexagon");
                                expect(label.ownerDocument.defaultView!.getComputedStyle(box).borderRadius).to.equal(
                                    corners === "circle" ? "50%" : "0px",
                                );
                                expect(label.getBoundingClientRect().height).to.equal(metrics.height);
                            });
                        cy.document().then((document) => document.fonts.ready);
                        cy.get(input)
                            .closest("label")
                            .then(($label) => {
                                const label = $label[0];
                                const box = label.querySelector<HTMLElement>('[aria-hidden="true"]')!;
                                const neighbour = label.ownerDocument.createElement("input");
                                neighbour.type = "text";
                                neighbour.style.cssText = `box-sizing:border-box;height:${metrics.height}px;vertical-align:middle`;
                                label.after(neighbour);
                                const measure = () => ({
                                    height: label.getBoundingClientRect().height,
                                    width: label.getBoundingClientRect().width,
                                    top: label.getBoundingClientRect().top,
                                    boxHeight: box.getBoundingClientRect().height,
                                    boxWidth: box.getBoundingClientRect().width,
                                    neighbourTop: neighbour.getBoundingClientRect().top,
                                });
                                const unchecked = measure();
                                expect(unchecked.height).to.equal(metrics.height);
                                expect(unchecked.boxHeight).to.equal(metrics.height - metrics.gap);
                                expect(unchecked.boxWidth).to.equal(metrics.height - metrics.gap);
                                expect(unchecked.top).to.equal(unchecked.neighbourTop);
                                expect(label.ownerDocument.defaultView!.getComputedStyle(box).borderRadius).to.equal(
                                    corners === "circle" ? "50%" : "0px",
                                );
                                cy.get(input).check({ force: true }).should("be.checked");
                                cy.get(input).should(() => {
                                    expect(
                                        measure(),
                                        `${control} ${size} ${corners} ${children || "unlabelled"}`,
                                    ).to.deep.equal(unchecked);
                                    if (control === "radio") {
                                        const marker = box.lastElementChild!;
                                        const window = label.ownerDocument.defaultView!;
                                        const style = window.getComputedStyle(marker);
                                        if (corners === "hexagon") {
                                            expect(style.backgroundColor).to.equal("rgba(0, 0, 0, 0)");
                                            expect(
                                                window.getComputedStyle(marker.querySelector("polygon")!).fill,
                                            ).to.equal(window.getComputedStyle(box).color);
                                        } else {
                                            expect(style.borderRadius).to.equal(corners === "circle" ? "50%" : "0px");
                                            expect(style.backgroundColor).to.equal(window.getComputedStyle(box).color);
                                        }
                                    }
                                });
                                cy.window()
                                    .its("__STORYBOOK_PREVIEW__.channel")
                                    .invoke("emit", "updateStoryArgs", {
                                        storyId,
                                        updatedArgs: { checked: false },
                                    });
                                cy.get(input)
                                    .should("not.be.checked")
                                    .should(() => expect(measure()).to.deep.equal(unchecked));
                                cy.then(() => neighbour.remove());
                            });
                    }
                }
            }
        });
    }
});
