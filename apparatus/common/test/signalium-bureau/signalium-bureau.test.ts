import { expect } from "chai";
import { describe, it } from "mocha";
import { SignaliumBureau } from "../../src";

describe("Signalium Bureau hints", () => {
    it("lets gears replace or clear their own hints without affecting others", () => {
        const bureau = new SignaliumBureau();
        const routeHint = { n: "route-story", t: "upload-file" };
        const otherHint = { n: "other-gear", t: "pick-a-point" };
        bureau.setHint("route-story", routeHint);
        bureau.setHint("other-gear", otherHint);
        bureau.setHint("route-story", { ...routeHint, t: "drag-marker" });
        expect(Array.from(bureau.hints$.value.values())).to.deep.equal([{ ...routeHint, t: "drag-marker" }, otherHint]);
        bureau.setHint("route-story", null);
        expect(Array.from(bureau.hints$.value.values())).to.deep.equal([otherHint]);
    });
});
