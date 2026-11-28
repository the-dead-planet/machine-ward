describe('Startup language', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/*.js', { body: '' });
    });

    it('uses the saved language ahead of the browser locale', () => {
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', JSON.stringify({
                    language: 'pl',
                }));
                cy.stub(window.Intl.DateTimeFormat.prototype, 'resolvedOptions').returns({ locale: 'de-DE' });
            },
        });
        cy.get('#startup-message').should('have.text', 'Zarząd martwej planety wita Cię...');
        cy.get('#startup-manifest-title').should('have.text', 'Włączanie zasilania oddziału maszyn:');
        cy.get('#startup-progress').should('have.attr', 'aria-labelledby', 'startup-manifest-title');
        cy.get('#startup-manifest').then(($manifest) => {
            const bounds = $manifest[0].getBoundingClientRect();
            cy.window().then((window) => {
                expect(bounds.left + bounds.width / 2).to.be.closeTo(window.innerWidth / 2, 1);
            });
        });
        cy.get('html').should('have.attr', 'lang', 'pl-PL');
    });

    it('matches a supported browser locale when saved settings are invalid', () => {
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', '{invalid');
                cy.stub(window.Intl.DateTimeFormat.prototype, 'resolvedOptions').returns({ locale: 'ja-JP' });
            },
        });
        cy.get('#startup-message').should('have.text', '死せる惑星の管理部があなたを歓迎します...');
        cy.get('html').should('have.attr', 'lang', 'ja-JP');
    });

    it('falls back to English for unsupported saved and browser languages', () => {
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', JSON.stringify({
                    language: '__proto__',
                }));
                cy.stub(window.Intl.DateTimeFormat.prototype, 'resolvedOptions').returns({ locale: 'fi-FI' });
            },
        });
        cy.get('#startup-message').should('have.text', 'The management of the dead planet welcomes you...');
        cy.get('html').should('have.attr', 'lang', 'en-US');
    });

    it('still uses the browser locale when storage access is blocked', () => {
        cy.visit('/', {
            onBeforeLoad: (window) => {
                cy.stub(window.localStorage, 'getItem').throws(new Error('Storage blocked'));
                cy.stub(window.Intl.DateTimeFormat.prototype, 'resolvedOptions').returns({ locale: 'de-AT' });
            },
        });
        cy.get('#startup-message').should('have.text', 'Die Verwaltung des toten Planeten heißt dich willkommen...');
    });

    it('reports completed downloads while an earlier deferred script is still pending', () => {
        const snapshots: {
            names: string[];
            states: Record<string, string>;
            nameOffsets: number[];
        }[] = [];
        cy.viewport(390, 844);
        cy.intercept('GET', /\/(?:vendors-react|react-vendors)[^/]*\.js$/, {
            body: '',
            delay: 600,
        });
        cy.intercept('GET', '**/web-ui*.js', {
            body: '',
            delay: 300,
        });
        cy.intercept('GET', '**/web-apparatus*.js', {
            body: '',
            delay: 350,
        });
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', JSON.stringify({ language: 'pl' }));
                const observer = new window.MutationObserver(() => {
                    const names: string[] = [];
                    const states: Record<string, string> = {};
                    const nameOffsets: number[] = [];
                    const manifest = window.document.getElementById('startup-manifest');
                    if (!manifest) {
                        return;
                    }
                    const manifestLeft = manifest.getBoundingClientRect().left;
                    for (const item of window.document.querySelectorAll('#startup-progress li')) {
                        const nameElement = item.lastElementChild;
                        const name = nameElement?.textContent;
                        const state = item.querySelector('[role="img"]')?.getAttribute('data-state');
                        if (nameElement && name && state) {
                            names.push(name);
                            states[name] = state;
                            nameOffsets.push(nameElement.getBoundingClientRect().left - manifestLeft);
                        }
                    }
                    if (names.length > 0) {
                        snapshots.push({ names, states, nameOffsets });
                    }
                });
                observer.observe(window.document, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['data-state'],
                });
                window.addEventListener('load', () => observer.disconnect(), { once: true });
            },
        });
        cy.document().then((document) => {
            const expectedDownloads = ['Zestaw do budowy interfejsu użytkownika', 'Aparatura'];
            if ([...document.scripts].some((script) => /\/tinker-chest\./.test(script.src))) {
                expectedDownloads.push('Skrzynia majsterkowicza');
            }
            const groupedLibraries = [
                {
                    bundle: '/web-ui.',
                    label: 'Zestaw do budowy interfejsu użytkownika',
                },
                {
                    bundle: '/web-apparatus.',
                    label: 'Aparatura',
                },
            ];
            for (const group of groupedLibraries) {
                if ([...document.scripts].some((script) => script.src.includes(group.bundle))) {
                    expect(snapshots.some((snapshot) => {
                        return snapshot.states['Skrzynia majsterkowicza'] === 'downloaded'
                            && snapshot.states[group.label] === 'pending';
                    }), group.label).to.equal(true);
                }
            }
            expect(snapshots.some((snapshot) => {
                return expectedDownloads.every((name) => snapshot.states[name] === 'downloaded')
                    && snapshot.states['Kora jednostki centralnej'] === 'pending';
            })).to.equal(true);
            const finalOrder = snapshots.at(-1)?.names ?? [];
            expect(finalOrder[0]).to.equal('Kora jednostki centralnej');
            expect(finalOrder.at(-2)).to.equal('Oddział maszyn');
            expect(finalOrder.at(-1)).to.equal('Ustawianie zębatek');
            expect(finalOrder).to.include('Skrzynia majsterkowicza');
            expect(finalOrder.indexOf('Skrzynia majsterkowicza')).to.be.lessThan(finalOrder.indexOf('Zestaw do budowy interfejsu użytkownika'));
            expect(finalOrder.indexOf('Zestaw do budowy interfejsu użytkownika')).to.be.lessThan(finalOrder.indexOf('Aparatura'));
            for (const snapshot of snapshots) {
                expect(snapshot.names).to.deep.equal(finalOrder);
                expect(snapshot.nameOffsets).to.deep.equal(snapshots[0].nameOffsets);
            }
        });
        cy.get('#startup-progress')
            .should('contain.text', 'Zestaw do budowy interfejsu użytkownika')
            .and('contain.text', 'Aparatura')
            .and('not.contain.text', 'React');
        cy.get('#startup-progress li:not(#startup-gears) [role="img"]').each((indicator) => {
            expect(indicator).to.have.attr('aria-label', 'Pobrano');
            expect(indicator).to.have.text('✓');
        });
    });

    it('names failed libraries instead of reporting them as loaded', () => {
        cy.intercept('GET', '**/ui*.js', { statusCode: 404, body: '' });
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', JSON.stringify({ language: 'pl' }));
            },
        });
        cy.contains('#startup-progress li', 'Zestaw do budowy interfejsu użytkownika')
            .find('[role="img"]')
            .should('have.attr', 'aria-label', 'Pobieranie nie powiodło się')
            .and('have.text', '!');
    });
});

describe('Gear-loading handoff', () => {
    it('keeps one translated loading screen until the React app is ready', () => {
        const loadingMessages: string[] = [];
        const loadingScreens = new Set<Element>();
        cy.intercept('GET', /\/(?:gear-|gears_).*\.js$/, (request) => {
            request.continue((response) => {
                response.setDelay(500);
            });
        });
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', JSON.stringify({
                    language: 'pl',
                }));
                cy.stub(window.Intl.DateTimeFormat.prototype, 'resolvedOptions').returns({ locale: 'de-DE' });
                const observer = new window.MutationObserver(() => {
                    const loadingPage = window.document.getElementById('startup-placeholder');
                    const message = window.document.querySelector('#startup-gears')?.lastElementChild?.textContent;
                    if (loadingPage && message) {
                        loadingScreens.add(loadingPage);
                        loadingMessages.push(message);
                    }
                });
                observer.observe(window.document, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['aria-label'],
                });
                window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
            },
        });
        cy.then(() => {
            expect(loadingMessages).to.include('Ustawianie zębatek');
            expect(loadingScreens.size).to.equal(1);
        });
        cy.get('#startup-placeholder').should('not.exist');
    });

    it('translates gear-load warnings and preserves the failed gear details', () => {
        cy.intercept('GET', /\/(?:gear-submit-data[.-]|gears_submit-data_).*\.js$/, {
            statusCode: 404,
            body: '',
        });
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', JSON.stringify({
                    language: 'pl',
                }));
                window.localStorage.setItem('cartomancer:map-style', JSON.stringify({
                    id: 'background',
                }));
            },
        });
        cy.contains('Niektóre zębatki się zacięły i nie udało się ich ustawić:')
            .should('be.visible')
            .and('contain.text', 'submit-data (')
            .and('not.contain.text', '{{gears}}');
    });
});
