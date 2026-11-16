import { expect } from "chai";
import { it } from "mocha";
import { getOutlinedThumbnail } from "../src/images/outlined-thumbnail";

it("composites the circular border before its photo into a single padded bitmap", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "OffscreenCanvas");
    const calls: unknown[][] = [];
    const image = {} as ImageBitmap;
    const bitmap = {} as ImageBitmap;
    const context = {
        fillStyle: "",
        beginPath: () => calls.push(["beginPath"]),
        arc: (...values: number[]) => calls.push(["arc", ...values]),
        fill: () => calls.push(["fill", context.fillStyle]),
        drawImage: (...values: unknown[]) => calls.push(["drawImage", ...values]),
    };
    Object.defineProperty(globalThis, "OffscreenCanvas", {
        configurable: true,
        value: class {
            public constructor(width: number, height: number) {
                calls.push(["canvas", width, height]);
            }
            public getContext() {
                return context;
            }
            public transferToImageBitmap() {
                return bitmap;
            }
        },
    });
    try {
        expect(getOutlinedThumbnail(image, "red")).to.equal(bitmap);
        expect(calls).to.deep.equal([
            ["canvas", 162, 162],
            ["beginPath"],
            ["arc", 81, 81, 81, 0, Math.PI * 2],
            ["fill", "red"],
            ["drawImage", image, 6, 6, 150, 150],
        ]);
    } finally {
        if (original) {
            Object.defineProperty(globalThis, "OffscreenCanvas", original);
        } else {
            Reflect.deleteProperty(globalThis, "OffscreenCanvas");
        }
    }
});
