import { expect } from "chai";
import { describe, it } from "mocha";
import { imageLayerIds } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { findMapImageFeature } from "../../src/images/tinkers";

const feature = (imageId: number, x: number, y: number, selected: boolean) => {
    const geometry: GeoJSON.Point = { type: "Point", coordinates: [x, y] };
    return {
        properties: {
            imageId,
            markerScale: selected ? 1.1 : 0.9,
            markerGroupSize: 6,
        },
        geometry,
        layer: {
            id: selected
                ? imageLayerIds.thumbnailsSelected
                : imageLayerIds.thumbnails,
        },
    };
};
const project = ([x, y]: [number, number]) => ({ x, y });

describe("Map image hit selection", () => {
    it("selects a foreground route hexagon before the translucent photo beneath it", () => {
        const lower = feature(2, 100, 65, false);
        const selected = feature(1, 100, 65, true);
        const anchor = {
            ...selected,
            properties: {
                ...selected.properties,
                markerAnchor: true,
                markerSelected: true,
            },
            layer: { id: imageLayerIds.anchorsSelected },
        };
        expect(findMapImageFeature([anchor, lower], { x: 100, y: 65 }, project)).to.equal(anchor);
        expect(findMapImageFeature([anchor, lower], { x: 100, y: 75 }, project)).to.equal(lower);
    });

    it("prefers the visible circle over another image's transparent bounds or outline", () => {
        const upper = feature(1, 100, 30, true);
        const lower = feature(2, 100, 65, false);
        const outline = {
            ...upper,
            layer: { id: imageLayerIds.thumbnailsSelectedOutline },
        };
        expect(
            findMapImageFeature(
                [outline, upper, lower],
                { x: 100, y: 65 },
                project,
            ),
        ).to.equal(lower);
        expect(
            findMapImageFeature(
                [outline, upper, lower],
                { x: 100, y: 40 },
                project,
            ),
        ).to.equal(upper);
    });
});
