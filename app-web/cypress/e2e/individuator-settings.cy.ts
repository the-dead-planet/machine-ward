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

        openSettings().should('be.checked');
        cy.get('[role="dialog"] input[type="checkbox"]').should(($inputs) => {
            const labelIds = $inputs.toArray().map((input) => input.getAttribute('aria-labelledby'));
            expect(labelIds).to.include.members([
                'individuator-confirm-before-leave-label',
                'individuator-enable-keyboard-shortcuts-label',
            ]);
        }).each(($input) => {
            const input = $input[0] as HTMLInputElement;
            const label = input.ownerDocument.getElementById(input.getAttribute('aria-labelledby')!);
            expect(label?.textContent?.trim()).to.be.a('string').and.not.be.empty;
            expect(input.labels).to.have.length(0);
        });
        cy.get('input[aria-labelledby="individuator-enable-keyboard-shortcuts-label"]')
            .click().should('not.be.checked');
        cy.document().then((document) => document.fonts.ready);
        const shortcutsButton = () => cy.get('[role="dialog"] button[aria-label="Go to keysmith"]');
        for (const [width, wraps] of [[1100, false], [500, false], [280, false], [200, true]] as const) {
            cy.viewport(width, 844);
            shortcutsButton().should(($button) => {
                expect($button.text().trim()).to.equal('');
                const document = $button[0].ownerDocument;
                const label = document.getElementById('individuator-enable-keyboard-shortcuts-label')!;
                const checkbox = document.querySelector('input[aria-labelledby="individuator-enable-keyboard-shortcuts-label"]')!.parentElement!.getBoundingClientRect();
                const button = $button[0].getBoundingClientRect();
                expect(document.defaultView!.getComputedStyle(label).textTransform).to.equal('uppercase');
                expect(label.dataset.unsaved).to.equal('true');
                const marker = document.defaultView!.getComputedStyle(label, '::before');
                expect(marker.position).to.equal('absolute');
                expect(marker.width).to.equal('4px');
                expect(marker.height).to.equal('4px');
                expect(marker.insetInlineStart).to.equal('-8px');
                if (width === 1100) {
                    const confirmLabel = document.getElementById('individuator-confirm-before-leave-label')!;
                    expect(label.offsetLeft).to.equal(confirmLabel.offsetLeft);
                    expect(label.getBoundingClientRect().left).to.be.lessThan(checkbox.left);
                }
                if (wraps) {
                    expect(button.top).to.be.at.least(checkbox.bottom);
                } else {
                    expect(button.top).to.be.lessThan(checkbox.bottom);
                    expect(button.left).to.be.at.least(checkbox.right);
                }
            });
        }
        cy.viewport(1100, 844);
        shortcutsButton().focus();
        cy.contains('[role="tooltip"]', /^Go to keysmith$/).should('be.visible');
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
        const chooseLanguage = (label: string) => {
            cy.get(
                'button[aria-labelledby="individuator-language-label"]',
            ).click();
            cy.contains('[role="listbox"] [role="option"]', label).click();
        };

        openSettings();
        const unsavedCount = '[role="dialog"] footer [role="status"]';
        cy.get(unsavedCount).should('be.empty');
        cy.get('[role="dialog"] [data-unsaved]').should('not.exist');
        cy.get('#individuator-language-label').then(($label) => {
            const originalLeft = $label[0].offsetLeft;
            chooseLanguage('Deutsch');
            cy.get('#individuator-language-label').should(($changedLabel) => {
                expect($changedLabel[0].offsetLeft).to.equal(originalLeft);
                expect($changedLabel).to.have.attr('data-unsaved', 'true');
                expect($changedLabel).to.contain.text('Unsaved change');
            });
        });
        cy.get('[role="dialog"] [data-unsaved]').should('have.length', 1);
        cy.get(unsavedCount).should('have.text', '1 unsaved change');
        const confirmBeforeLeave = 'input[aria-labelledby="individuator-confirm-before-leave-label"]';
        cy.get(confirmBeforeLeave).click();
        cy.get(unsavedCount).should('have.text', '2 unsaved changes');
        cy.get(confirmBeforeLeave).click();
        chooseLanguage('English');
        cy.get('[role="dialog"] [data-unsaved]').should('not.exist');
        cy.get(unsavedCount).should('be.empty');
        chooseLanguage('Deutsch');
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
        cy.get('[role="dialog"] [data-unsaved]').should('not.exist');
        chooseLanguage('Deutsch');
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
