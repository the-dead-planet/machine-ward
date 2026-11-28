import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Translatron } from '../../src/machine-ward/translatron/translatron';

describe('Startup language selection', () => {
    it('keeps a supported saved language ahead of the device locale', () => {
        expect(Translatron.resolveLanguage('pl', 'de-DE')).to.equal('pl');
        expect(Translatron.resolveLanguage('jp', 'en-US')).to.equal('jp');
    });

    it('matches supported regional locales, including the Japanese language identifier', () => {
        expect(Translatron.resolveLanguage(undefined, 'de-AT')).to.equal('de');
        expect(Translatron.resolveLanguage(undefined, 'FR_ca')).to.equal('fr');
        expect(Translatron.resolveLanguage(undefined, 'ja-JP')).to.equal('jp');
    });

    it('ignores invalid saved values and falls back to English for unsupported locales', () => {
        expect(Translatron.resolveLanguage('unsupported', 'es-MX')).to.equal('es');
        expect(Translatron.resolveLanguage({}, 'nl-NL')).to.equal('nl');
        expect(Translatron.resolveLanguage('__proto__', 'constructor')).to.equal('en');
        expect(Translatron.resolveLanguage(null, 'fi-FI')).to.equal('en');
    });
});
