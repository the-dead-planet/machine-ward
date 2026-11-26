import { expect } from "chai";
import { it } from "mocha";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useImageLayerAssets } from "../../src/images/useImageLayerAssets";

it("reuses outlined bitmaps for position edits and rebuilds only changed thumbnails or colors", async () => {
    const globals = ["IS_REACT_ACT_ENVIRONMENT", "Image", "OffscreenCanvas", "Path2D"];
    const descriptors = globals.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
    let rasterizations = 0;
    class Canvas {
        public constructor() {
            rasterizations++;
        }
        public getContext() {
            return { clip() {}, fill() {}, drawImage() {} };
        }
        public transferToImageBitmap() {
            return {};
        }
    }
    class LoadedImage {
        public onload = () => {};
        public set src(_source: string) {
            this.onload();
        }
    }
    for (const [name, value] of Object.entries({ IS_REACT_ACT_ENVIRONMENT: true, Image: LoadedImage, OffscreenCanvas: Canvas, Path2D: class {} })) {
        Object.defineProperty(globalThis, name, { value, configurable: true });
    }
    const registered = new Set<string>();
    const additions: string[] = [];
    const removals: string[] = [];
    const map = {
        hasImage: (name: string) => registered.has(name),
        addImage: (name: string) => {
            additions.push(name);
            registered.add(name);
        },
        removeImage: (name: string) => {
            removals.push(name);
            registered.delete(name);
        },
    } as unknown as MapLibreMap;
    type Images = Parameters<typeof useImageLayerAssets>[1];
    const bitmap = (): ImageBitmap => ({}) as ImageBitmap;
    const images: Images = Array.from({ length: 100 }, (_value, id) => ({
        id,
        name: `photo-${id}.jpg`,
        distanceFraction: 0.5,
        data: { bitmap: bitmap(), thumbnailBitmap: bitmap() },
    }));
    const Probe = ({ images, color }: { images: Images; color: string }) => {
        useImageLayerAssets(map, images, color, "#345678", "#ffffff");
        return null;
    };
    const root = createRoot();
    try {
        await act(async () => root.render(createElement(Probe, { images, color: "#123456" })));
        expect(rasterizations).to.equal(300);
        const initialAdditions = additions.length;
        const moved = images.map((image) => (image.id === 0 ? { ...image, distanceFraction: 0.7 } : image));
        await act(async () => root.render(createElement(Probe, { images: moved, color: "#123456" })));
        expect(rasterizations).to.equal(300);
        expect(additions).to.have.length(initialAdditions);
        expect(removals).to.deep.equal([]);
        const changed = moved.map((image) => (image.id === 0 ? { ...image, data: { ...image.data, thumbnailBitmap: bitmap() } } : image));
        await act(async () => root.render(createElement(Probe, { images: changed, color: "#123456" })));
        expect(rasterizations).to.equal(303);
        expect(additions).to.have.length(initialAdditions + 3);
        expect(removals).to.have.length(3);
        await act(async () => root.render(createElement(Probe, { images: changed, color: "#abcdef" })));
        expect(rasterizations).to.equal(403);
        await act(async () => root.render(createElement(Probe, { images: [], color: "#abcdef" })));
        await act(async () => root.render(createElement(Probe, { images: changed, color: "#abcdef" })));
        expect(rasterizations).to.equal(703);
    } finally {
        await act(async () => root.unmount());
        expect(registered.size).to.equal(0);
        globals.forEach((name, index) => {
            const descriptor = descriptors[index];
            if (descriptor) {
                Object.defineProperty(globalThis, name, descriptor);
            } else {
                Reflect.deleteProperty(globalThis, name);
            }
        });
    }
});
