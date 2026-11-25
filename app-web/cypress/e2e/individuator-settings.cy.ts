describe('Individuator settings draft', () => {
    it('slides menu drawers in without scrolling and restores focus without reopening the menu tooltip', () => {
        cy.viewport(1100, 844);
        cy.visit('/', {
            onBeforeLoad(window) {
                window.localStorage.clear();
                window.localStorage.setItem('cartomancer:map-style', JSON.stringify({ id: 'background' }));
            },
        });
        cy.document().then((document) => document.fonts.ready);
        const menu = 'button[aria-label="Application menu"]';
        for (const [item, close] of [[0, /^Cancel$/], [0, /^Save$/], [1, /^Close$/]] as const) {
            let entrance: Promise<number[]>;
            cy.get(menu).click();
            const menuItem = () => cy.get('[role="menu"] [role^="menuitem"]').eq(item);
            menuItem().then(($item) => {
                const document = $item[0].ownerDocument;
                const window = document.defaultView!;
                entrance = new Promise((resolve, reject) => {
                    const positions: number[] = [];
                    const observer = new window.MutationObserver(() => {
                        const dialog = document.querySelector('[role="dialog"]');
                        const surface = dialog?.querySelector('h3')?.parentElement;
                        if (!surface || !dialog) {
                            return;
                        }
                        observer.disconnect();

                        const started = window.performance.now();
                        const sample = () => {
                            if (dialog.scrollLeft !== 0 || dialog.scrollTop !== 0) {
                                reject(new Error('Focus scrolled the dialog overlay during entrance'));
                                return;
                            }
                            positions.push(surface.getBoundingClientRect().left);
                            if (positions.length === 1 || window.performance.now() - started < 350) {
                                window.requestAnimationFrame(sample);
                            } else {
                                resolve(positions);
                            }
                        };
                        sample();
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            });
            menuItem().click();
            cy.then(() => entrance).then((positions) => {
                expect(positions.length).to.be.greaterThan(1);
                expect(positions.every((position, index) => index === 0 || position <= positions[index - 1] + 1),
                    'drawer moves left without reversing').to.equal(true);
            });
            cy.contains('[role="dialog"] button', close).click();
            cy.get('[role="dialog"]').should('not.exist');
            cy.get(menu).should('be.focused').and('not.have.attr', 'aria-describedby');
        }

        cy.get(menu).prev('button').focus();
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(menu).should('be.focused').and('have.attr', 'aria-describedby');
        cy.contains('[role="tooltip"]', 'Application menu').should('be.visible');
    });

    it('opens the shortcuts overview from settings without saving the checkbox draft', () => {
        cy.viewport(1100, 844);
        cy.visit('/', {
            onBeforeLoad(window) {
                window.localStorage.clear();
                window.localStorage.setItem('cartomancer:map-style', JSON.stringify({ id: 'background' }));
            },
        });

        const openSettings = () => {
            cy.get('button[aria-label="Application menu"]').click();
            cy.get('[role="menu"] [role^="menuitem"]').first().click();
            return cy.get('input[aria-labelledby="individuator-enable-keyboard-shortcuts-label"]');
        };

        openSettings().should('be.checked').uncheck({ force: true });
        cy.document().then((document) => document.fonts.ready);
        const shortcutsButton = () => cy.get('[role="dialog"] button[aria-label="Go to keyboard shortcuts"]');
        for (const [width, wraps] of [[1100, false], [500, false], [280, true]] as const) {
            cy.viewport(width, 844);
            shortcutsButton().should(($button) => {
                expect($button.text().trim()).to.equal('Go to');
                const label = $button[0].ownerDocument.getElementById('individuator-enable-keyboard-shortcuts-label')!;
                const checkbox = label.closest('label')!.getBoundingClientRect();
                const button = $button[0].getBoundingClientRect();
                if (wraps) {
                    expect(button.top).to.be.at.least(checkbox.bottom);
                } else {
                    expect(button.top).to.be.lessThan(checkbox.bottom);
                    expect(button.left).to.be.at.least(checkbox.right);
                }
            });
        }
        cy.viewport(1100, 844);
        shortcutsButton().click();
        cy.get('[role="dialog"]').should('have.length', 1).and('contain.text', 'Keyboard shortcuts');
        cy.contains('[role="dialog"] button', /^Close$/).click();
        cy.get('[role="dialog"]').should('not.exist');
        openSettings().should('be.checked');
    });

    it('keeps language changes local until Save and discards them on Cancel', () => {
        cy.visit('/', {
            onBeforeLoad(window) {
                window.localStorage.clear();
            },
        });

        const openSettings = () => {
            cy.get('button[aria-label="Application menu"]').click();
            cy.get('[role="menu"] [role^="menuitem"]').first().click();
            cy.get('[role="dialog"]').should('be.visible');
        };
        const chooseGerman = () => {
            cy.get(
                'button[aria-labelledby="individuator-language-label"]',
            ).click();
            cy.contains('[role="listbox"] [role="option"]', 'Deutsch').click();
        };

        openSettings();
        chooseGerman();
        cy.get('button[aria-label="Application menu"]').should('exist');
        cy.get('[role="dialog"]')
            .contains('button', /^Cancel$/)
            .click();
        cy.get('[role="dialog"]').should('not.exist');
        cy.get('button[aria-label="Application menu"]').should('exist');

        openSettings();
        cy.get('button[aria-labelledby="individuator-language-label"]').should(
            'contain.text',
            'English',
        );
        chooseGerman();
        cy.get('button[aria-label="Application menu"]').should('exist');
        cy.get('[role="dialog"]')
            .contains('button', /^Save$/)
            .click();
        cy.get('[role="dialog"]').should('not.exist');
        cy.get('button[aria-label="Anwendungsmenü"]').should('exist');
        cy.reload();
        cy.get('button[aria-label="Anwendungsmenü"]').should('exist');
    });
});
