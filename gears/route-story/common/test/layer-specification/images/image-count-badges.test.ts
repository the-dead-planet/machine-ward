import { expect } from "chai";
import { describe, it } from "mocha";
import { formatImageMarkerCount } from "../../../src/tinkers/images";
import {
    getImageCountBadges,
    getImageCountBadgeImageName,
} from "../../../src/layer-specification/images/image-count-badges";
import ImagesLayers from "../../../src/layer-specification/images/images-layers";

describe("Composite image count badges", () => {
    it("keeps badge colors and layer opacity fully opaque", () => {
        const badges = getImageCountBadges(
            "rgba(18, 52, 86, 0.4)",
            "rgba(255, 255, 255, 0.5)",
        );
        for (const { svg } of badges) {
            expect(svg)
                .to.include('fill="#123456"')
                .and.include('fill="#ffffff"');
            expect(svg).not.to.include("rgba(").and.not.to.include("opacity=");
        }
        expect(ImagesLayers.countBadge.paint["icon-opacity"]).to.equal(1);
    });
    it("provides exactly ten outlined labels, with both theme colors in each image", () => {
        for (const [background, text] of [
            ["#123456", "#ffffff"],
            ["#abcdef", "#111111"],
        ]) {
            const badges = getImageCountBadges(background, text);
            expect(badges.map(({ id }) => id)).to.deep.equal(
                ["1", "2", "3", "4", "5", "6", "7", "8", "9", "9+"].map(
                    (label) =>
                        getImageCountBadgeImageName(label, background, text),
                ),
            );
            for (const { svg } of badges) {
                expect(svg)
                    .to.include(`<polygon points=`)
                    .and.include(`fill="${background}"`);
                expect(svg)
                    .to.include('<path d="M ')
                    .and.include(`fill="${text}"`);
                expect(svg).not.to.include("<text");
            }
            expect(
                ImagesLayers.countBadge.getLayout(background, text)[
                    "icon-image"
                ],
            ).to.deep.equal([
                "concat",
                getImageCountBadgeImageName("", background, text),
                [
                    "case",
                    [">", ["get", "markerCount"], 9],
                    "9+",
                    ["to-string", ["get", "markerCount"]],
                ],
            ]);
        }
        expect([1, 9, 10, 100].map(formatImageMarkerCount)).to.deep.equal([
            "1",
            "9",
            "9+",
            "9+",
        ]);
    });
});
