import { expect } from "chai";
import { describe, it } from "mocha";
import { getNoticeCountKey, getNoticeTickerDuration, SignaliumBureau, Translatron } from "../../src";
import { pl } from "../../src/machine-ward/translations";

describe("Signalium Bureau hints", () => {
    it("lets gears replace or clear their own hints without affecting others", () => {
        const bureau = new SignaliumBureau();
        const routeHint = { text: { n: "route-story", t: "upload-file" } };
        const otherHint = { text: { n: "other-gear", t: "pick-a-point" } };
        bureau.setHint("route-story", routeHint);
        bureau.setHint("other-gear", otherHint);
        bureau.setHint("route-story", { text: { n: "route-story", t: "drag-marker" } });
        expect(Array.from(bureau.hints$.value.values())).to.deep.equal([{ text: { n: "route-story", t: "drag-marker" } }, otherHint]);
        bureau.setHint("route-story", null);
        expect(Array.from(bureau.hints$.value.values())).to.deep.equal([otherHint]);
    });
});

describe("Signalium Bureau notice counts", () => {
    it("uses natural Polish counts for each notice type", () => {
        const translatron = new Translatron();
        translatron.register("machine-ward", { pl });
        const countLabel = (type: Parameters<typeof getNoticeCountKey>[0], count: number) => translatron.translate(
            "pl", translatron.registry$.value,
            { n: "machine-ward", t: getNoticeCountKey(type, count, "pl"), p: { count } },
        );

        expect([1, 2, 5, 12, 22].map((count) => countLabel("glitch", count)))
            .to.deep.equal(["1 usterka", "2 usterki", "5 usterek", "12 usterek", "22 usterki"]);
        expect([1, 2, 5].map((count) => countLabel("hazard", count)))
            .to.deep.equal(["1 zagrożenie", "2 zagrożenia", "5 zagrożeń"]);
        expect([1, 2, 5].map((count) => countLabel("intel", count)))
            .to.deep.equal(["1 informacja wywiadowcza", "2 informacje wywiadowcze", "5 informacji wywiadowczych"]);
        expect([1, 2, 5].map((count) => countLabel("secured", count)))
            .to.deep.equal(["1 potwierdzenie", "2 potwierdzenia", "5 potwierdzeń"]);
    });
});

describe("Notice ticker", () => {
    it("scrolls at 75 pixels per second", () => {
        expect(getNoticeTickerDuration(75)).to.equal(1000);
        expect(getNoticeTickerDuration(150)).to.equal(2000);
    });
});
