import { expect } from "chai";
import { describe, it } from "mocha";
import { DateFormat } from "@tinker-chest";
import { Individuator, IndividuatorSettings, StorageKeeper, Translatron } from "../../src";

describe("Individuator", () => {
    it("shows guide hints by default", () => {
        expect(new Individuator(false).settings$.value.showGuideHints).to.equal(true);
    });

    it("uses the runtime locale by default", () => {
        expect(new Individuator(false).settings$.value.locale).to.equal(Intl.DateTimeFormat().resolvedOptions().locale);
    });

    it("uses a supported device language by default and restores the saved selection", async () => {
        const individuator = new Individuator(false);
        expect(individuator.settings$.value.language).to.equal(Translatron.resolveLanguage(undefined));

        const storageKeeper = new StorageKeeper({
            getItem: () => Promise.resolve(JSON.stringify({ language: 'jp' })),
            setItem: () => { },
            removeItem: () => { },
        });
        await individuator.initialize(storageKeeper, new Translatron());
        try {
            expect(individuator.settings$.value.language).to.equal('jp');
        } finally {
            individuator.cleanUp();
        }
    });

    it("infers distance units from the locale region", () => {
        expect(Individuator.getPreferredDistanceUnit('en-US')).to.equal('imperial');
        expect(Individuator.getPreferredDistanceUnit('en-Latn-US')).to.equal('imperial');
        expect(Individuator.getPreferredDistanceUnit('en-GB')).to.equal('imperial');
        expect(Individuator.getPreferredDistanceUnit('de')).to.equal('metric');
    });

    it("formats weekdays in the selected language instead of the saved device locale", () => {
        const individuator = new Individuator(false);
        const settings: IndividuatorSettings = {
            ...individuator.settings$.value,
            locale: "en-US",
            language: "de",
            dateFormat: {
                value: DateFormat.EEEEddMMyyyy,
                short: DateFormat.ddMMyyyy,
            },
        };

        expect(
            individuator.formatTimestamp(
                new Date(2026, 5, 19, 12).valueOf(),
                settings,
            ),
        ).to.include("Freitag");
    });
});
