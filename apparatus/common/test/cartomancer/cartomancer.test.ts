import { expect } from "chai";
import { describe } from "mocha";
import { Cartomancer } from "../../src/index.js";

describe("Cartomancer", () => {
    it("starts without viewport bounds and clears detached map bounds on cleanup", () => {
        const cartomancer = new Cartomancer<unknown>();
        expect(cartomancer.bounds$.value).to.equal(null);
        cartomancer.bounds$.next([-10, -5, 10, 5]);
        expect(cartomancer.bounds$.value).to.deep.equal([-10, -5, 10, 5]);
        cartomancer.cleanUp();
        expect(cartomancer.bounds$.value).to.equal(null);
    });
    describe("Buffer", () => {
        it("should get correct buffer in meters for a latitude and zoom", () => {
            expect(Cartomancer.getBufferInMeters(52, 13)).to.be.equal(47);
        });
        it("should get correct buffer in meters for a latitude and zoom with added offset", () => {
            expect(Cartomancer.getBufferInMeters(52, 18, 10)).to.be.equal(5);
        });
    });
});
