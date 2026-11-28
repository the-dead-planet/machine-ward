import { expect } from "chai";
import { it } from "mocha";
import { getPlayerSliderStep } from "../src/tinkers/player";

it("steps the player by one meter or one second in milliseconds", () => {
    expect(getPlayerSliderStep("distance")).to.equal(1);
    expect(getPlayerSliderStep("timeline")).to.equal(1000);
});
