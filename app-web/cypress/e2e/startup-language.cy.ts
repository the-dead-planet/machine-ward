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
});
