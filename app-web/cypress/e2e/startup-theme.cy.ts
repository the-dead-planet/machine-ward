import { ThemeName } from '@the-dead-planet/machine-ward-ui-common/src/design-system/theme/model';
import { themeSpecifications } from '@the-dead-planet/machine-ward-ui-common/src/design-system/theme/specifications';

describe('Startup placeholder', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/*.js', { body: '' });
    });

    it('uses the saved named theme before the app bundles load', () => {
        cy.visit('/', {
            onBeforeLoad: (window) => {
                window.localStorage.setItem('application-settings', JSON.stringify({
                    themeName: ThemeName.Batman,
                    themeMode: 'light',
                }));
            },
        });
        const neutral = themeSpecifications[ThemeName.Batman].light.colors.neutral;
        cy.get('#startup-placeholder')
            .should('have.css', 'background-color', `rgb(${neutral[50].r}, ${neutral[50].g}, ${neutral[50].b})`)
            .and('have.css', 'color', `rgb(${neutral[900].r}, ${neutral[900].g}, ${neutral[900].b})`);
        cy.document().then((document) => document.fonts.load('16px "Syne Mono"'));
        cy.document().should((document) => {
            expect([...document.fonts].some((font) => font.family.replaceAll('"', '') === 'Syne Mono' && font.status === 'loaded')).to.equal(true);
        });
    });

    for (const savedSettings of [null, '{invalid', '{"themeName":"__proto__","themeMode":"unknown"}']) {
        it(`falls back to the default dark theme for ${savedSettings}`, () => {
            cy.visit('/', {
                onBeforeLoad: (window) => {
                    window.localStorage.removeItem('application-settings');
                    if (savedSettings !== null) {
                        window.localStorage.setItem('application-settings', savedSettings);
                    }
                },
            });
            const background = themeSpecifications[ThemeName.Default].dark.colors.neutral[900];
            cy.get('#startup-placeholder').should('have.css', 'background-color', `rgb(${background.r}, ${background.g}, ${background.b})`);
        });
    }

    it('still renders when storage access is blocked', () => {
        cy.visit('/', {
            onBeforeLoad: (window) => {
                cy.stub(window.localStorage, 'getItem').throws(new Error('Storage blocked'));
            },
        });
        cy.get('#startup-placeholder').should('be.visible');
    });
});
