import { expect } from "chai";
import { it } from "mocha";
import { getOutlinedThumbnail } from "../src/images/outlined-thumbnail";

it("composites the hexagon border and clips its image into a single padded bitmap", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "OffscreenCanvas");
    const originalPath = Object.getOwnPropertyDescriptor(globalThis, "Path2D");
    const calls: unknown[][] = [];
    const image = {} as ImageBitmap;
    const bitmap = {} as ImageBitmap;
    const context = {
        fillStyle: "",
        fill: (path: { value: string }) => calls.push(["fill", context.fillStyle, path.value]),
        clip: (path: { value: string }) => calls.push(["clip", path.value]),
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
    Object.defineProperty(globalThis, "Path2D", {
        configurable: true,
        value: class { public constructor(public value: string) {} },
    });
    try {
        expect(getOutlinedThumbnail(image, "red", "hexagon")).to.equal(bitmap);
        const outlineHalfHeight = 81 * Math.sqrt(3) / 2;
        const imageHalfHeight = 75 * Math.sqrt(3) / 2;
        expect(calls).to.deep.equal([
            ["canvas", 162, 162],
            ["fill", "red", `M0 81 L40.5 ${81 - outlineHalfHeight} H121.5 L162 81 L121.5 ${81 + outlineHalfHeight} H40.5Z`],
            ["clip", `M6 81 L43.5 ${81 - imageHalfHeight} H118.5 L156 81 L118.5 ${81 + imageHalfHeight} H43.5Z`],
            ["drawImage", image, 6, 6, 150, 150],
        ]);
    } finally {
        if (originalPath) {
            Object.defineProperty(globalThis, "Path2D", originalPath);
        } else {
            Reflect.deleteProperty(globalThis, "Path2D");
        }
        if (original) {
            Object.defineProperty(globalThis, "OffscreenCanvas", original);
        } else {
            Reflect.deleteProperty(globalThis, "OffscreenCanvas");
        }
    }
});
