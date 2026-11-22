import { expect } from "chai";
import { getSliderRanges, getSliderRatio, snapSliderValue } from "../../src/forms/slider/tinkers";

describe("Slider values", () => {
    it("clips and merges underlays without filling gaps or changing caller ranges", () => {
        const ranges = [
            { start: 16, end: 30 },
            { start: 5, end: 12 },
            { start: 11, end: 14 },
            { start: 14, end: 15 },
        ];
        expect(getSliderRanges(ranges, 10, 20)).to.deep.equal([
            { start: 0, end: 0.5 },
            { start: 0.6, end: 1 },
        ]);
        expect(ranges[1]).to.deep.equal({ start: 5, end: 12 });
    });

    it("ignores empty, reversed, non-finite and out-of-domain underlays", () => {
        const ranges = [
            { start: 1, end: 1 },
            { start: 3, end: 2 },
            { start: NaN, end: 2 },
            { start: 1, end: Infinity },
            { start: -10, end: -1 },
            { start: 11, end: 12 },
        ];
        expect(getSliderRanges(ranges, 0, 10)).to.deep.equal([]);
        expect(getSliderRanges([{ start: 0, end: 10 }], 10, 10)).to.deep.equal([]);
        expect(getSliderRanges([{ start: 0, end: 10 }], 10, 0)).to.deep.equal([]);
        expect(getSliderRanges([], 0, 10)).to.deep.equal([]);
    });

    it("clamps progress, including empty and reversed ranges", () => {
        expect(getSliderRatio(15, 10, 20)).to.equal(0.5);
        expect(getSliderRatio(-1, 10, 20)).to.equal(0);
        expect(getSliderRatio(30, 10, 20)).to.equal(1);
        expect(getSliderRatio(10, 10, 10)).to.equal(0);
        expect(getSliderRatio(10, 20, 10)).to.equal(0);
    });

    it("snaps relative to the minimum without leaking decimal rounding errors", () => {
        expect(snapSliderValue(0.31, 0, 1, 0.1)).to.equal(0.3);
        expect(snapSliderValue(11.6, 10, 20, 3)).to.equal(13);
        expect(snapSliderValue(-20, 10, 20, 3)).to.equal(10);
        expect(snapSliderValue(30, 10, 20, 3)).to.equal(20);
        expect(snapSliderValue(0, 10, 10, 1)).to.equal(10);
        expect(snapSliderValue(12.2, 10, 20, 0)).to.equal(12);
    });
});
