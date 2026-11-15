import { expect } from "chai";
import { describe, it } from "mocha";
import {
    createExpression,
    validateStyleMin,
} from "@maplibre/maplibre-gl-style-spec";
import {
    DRAGGED_IMAGE_ID,
    imageLayerIds,
    imageSourceIds,
    MAP_IMAGE_MARKER_OFFSET_Y,
    MAP_IMAGE_ANCHOR_SIDE,
    MAP_IMAGE_ANCHOR_GAP,
    THUMBNAIL_IMAGE_SIZE,
    MAP_THUMBNAIL_SIZE,
    ImagesLayers,
    getOutlinedThumbnailId,
    OUTLINED_MAP_THUMBNAIL_SIZE,
    getMapImageThumbnailOffsetY,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import {
    getImagesLayers,
    getImageDragPreviewLayers,
} from "../src/images/images-layers";

describe("Image marker layers", () => {
    it("stacks each default photo and its baked outline as one symbol, including hover", () => {
        const layers = getImagesLayers(null, "red", "blue", "green", "white");
        expect(
            layers.some(({ id }) => id === imageLayerIds.thumbnailsOutline),
        ).to.equal(false);
        const thumbnail = layers.find(
            ({ id }) => id === imageLayerIds.thumbnails,
        );
        const parsed = createExpression(
            thumbnail?.type === "symbol"
                ? thumbnail.layout?.["icon-image"]
                : undefined,
            "icon-image",
        );
        if (parsed.result !== "success") {
            throw new Error("Invalid outlined thumbnail image expression");
        }
        for (const highlighted of [false, true]) {
            expect(
                parsed.value.evaluate(
                    { zoom: 0 },
                    {
                        type: "Point",
                        properties: {
                            iconImageThumbnailId: "photo-1",
                            highlight: highlighted,
                        },
                    },
                ),
            ).to.equal(
                getOutlinedThumbnailId("photo-1", highlighted ? "blue" : "red"),
            );
        }
    });

    it("anchors standalone growth at the bottom and keeps the outline centered on the image", () => {
        const evaluate = (
            expression: unknown,
            properties: Record<string, number | boolean>,
        ): unknown => {
            const parsed = createExpression(expression, "thumbnail-offset");
            if (parsed.result !== "success") {
                throw new Error("Invalid thumbnail offset expression");
            }
            return parsed.value.evaluate(
                { zoom: 0 },
                { type: "Point", properties },
            );
        };
        for (const scale of [1, 1.025, 1.05, 1.1]) {
            const properties = {
                markerGroupSize: 1,
                markerScale: scale,
                markerSelected: true,
            };
            const imageSize = evaluate(
                ImagesLayers.thumbnails.layout["icon-size"],
                properties,
            );
            const imageOffset = evaluate(
                ImagesLayers.thumbnails.layout["icon-offset"],
                properties,
            );
            const outlineSize = evaluate(
                ImagesLayers.thumbnailsOutline.layout["icon-size"],
                properties,
            );
            const outlineOffset = evaluate(
                ImagesLayers.thumbnailsOutline.layout["icon-offset"],
                properties,
            );
            if (
                typeof imageSize !== "number" ||
                typeof outlineSize !== "number" ||
                !Array.isArray(imageOffset) ||
                !Array.isArray(outlineOffset)
            ) {
                throw new Error("Invalid thumbnail geometry");
            }
            const centerShift = Number(imageOffset[1]) * imageSize;
            expect(
                centerShift + (THUMBNAIL_IMAGE_SIZE * scale) / 2,
            ).to.be.closeTo(THUMBNAIL_IMAGE_SIZE / 2, 0.00001);
            expect(Number(outlineOffset[1]) * outlineSize).to.be.closeTo(
                centerShift,
                0.00001,
            );
            expect(
                getMapImageThumbnailOffsetY(1, scale) -
                    MAP_IMAGE_MARKER_OFFSET_Y,
            ).to.be.closeTo(centerShift, 0.00001);
            expect(
                evaluate(ImagesLayers.thumbnails.layout["icon-offset"], {
                    ...properties,
                    markerGroupSize: 6,
                }),
            ).to.deep.equal([0, 0]);
        }
    });

    it("draws selected photos and borders above all unselected photos without drawing either twice", () => {
        const layers = getImagesLayers(
            null,
            "#123456",
            "#345678",
            "#567890",
            "#ffffff",
        );
        const photo = layers.findIndex(
            ({ id }) => id === imageLayerIds.thumbnails,
        );
        const selectedOutline = layers.findIndex(
            ({ id }) => id === imageLayerIds.thumbnailsSelectedOutline,
        );
        const selectedAnchor = layers.findIndex(
            ({ id }) => id === imageLayerIds.anchorsSelected,
        );
        const selectedPhoto = layers.findIndex(
            ({ id }) => id === imageLayerIds.thumbnailsSelected,
        );
        expect(selectedOutline).to.be.greaterThan(photo);
        expect(selectedAnchor).to.be.greaterThan(photo);
        expect(selectedAnchor).to.be.lessThan(selectedOutline);
        expect(selectedPhoto).to.be.greaterThan(selectedOutline);
        for (const selected of [false, true]) {
            for (const specification of [
                ImagesLayers.thumbnails,
                ImagesLayers.thumbnailsOutline,
                ImagesLayers.thumbnailsSelected,
                ImagesLayers.thumbnailsSelectedOutline,
            ]) {
                const parsed = createExpression(specification.filter, "filter");
                if (parsed.result !== "success") {
                    throw new Error("Invalid thumbnail filter");
                }
                const foreground =
                    specification === ImagesLayers.thumbnailsSelected ||
                    specification === ImagesLayers.thumbnailsSelectedOutline;
                expect(
                    parsed.value.evaluate(
                        { zoom: 0 },
                        {
                            type: "Point",
                            properties: {
                                imageId: 1,
                                markerVisible: true,
                                markerSelected: selected,
                            },
                        },
                    ),
                ).to.equal(selected === foreground);
            }
        }
    });

    it("uses matching outline and anchor colors, with selected and dragged states above hover", () => {
        const layers = getImagesLayers(
            null,
            "#123456",
            "#345678",
            "#567890",
            "#ffffff",
        );
        const outline = layers.find(
            ({ id }) => id === imageLayerIds.thumbnailsSelectedOutline,
        );
        const anchor = layers.find(({ id }) => id === imageLayerIds.anchors);
        const paint =
            outline?.type === "symbol"
                ? outline.paint?.["icon-color"]
                : undefined;
        expect(
            anchor?.type === "symbol" && anchor.paint?.["icon-color"],
        ).to.deep.equal(paint);
        const parsed = createExpression(paint, "icon-color");
        expect(parsed.result).to.equal("success");
        if (parsed.result !== "success") {
            throw new Error("Invalid marker color expression");
        }
        const evaluate = (
            properties: Record<string, boolean>,
            state: Record<string, boolean>,
        ) =>
            parsed.value.evaluate(
                { zoom: 0 },
                { type: "Point", properties },
                state,
            );
        expect(evaluate({}, {})).to.equal("#123456");
        expect(evaluate({}, { highlight: true })).to.equal("#345678");
        expect(evaluate({ highlight: true }, {})).to.equal("#345678");
        expect(
            evaluate({ markerSelected: true }, { highlight: true }),
        ).to.equal("#567890");
        expect(evaluate({}, { highlight: true, dragging: true })).to.equal(
            "#567890",
        );
        expect(evaluate({ dragging: true }, {})).to.equal("#567890");
        const connections = createExpression(
            ImagesLayers.connections.getPaint(
                "#123456",
                "#345678",
                "#567890",
                42,
            )["line-color"],
            "line-color",
        );
        expect(connections.result).to.equal("success");
        if (connections.result !== "success") {
            throw new Error("Invalid connector color expression");
        }
        const evaluateConnection = (
            imageId: number,
            state: Record<string, boolean>,
        ) =>
            connections.value.evaluate(
                { zoom: 0 },
                { type: "LineString", properties: { imageId } },
                state,
            );
        expect(evaluateConnection(42, {})).to.equal("#567890");
        expect(evaluateConnection(42, { highlight: true })).to.equal("#567890");
        expect(evaluateConnection(10, { highlight: true })).to.equal("#345678");
        expect(evaluateConnection(10, {})).to.equal("#123456");
    });

    it("renders selected route hexagons only in the foreground and retains drag-preview anchors", () => {
        for (const selected of [false, true]) {
            const variants = [
                {
                    specification: ImagesLayers.anchorsUnselected,
                    selected: false,
                },
                { specification: ImagesLayers.anchorsSelected, selected: true },
            ];
            for (const variant of variants) {
                const parsed = createExpression(
                    variant.specification.filter,
                    "filter",
                );
                if (parsed.result !== "success") {
                    throw new Error("Invalid route anchor filter");
                }
                expect(
                    parsed.value.evaluate(
                        { zoom: 0 },
                        {
                            type: "Point",
                            properties: {
                                imageId: 1,
                                markerAnchor: true,
                                markerVisible: true,
                                markerSelected: selected,
                            },
                        },
                    ),
                ).to.equal(variant.selected === selected);
            }
        }
        const preview = createExpression(ImagesLayers.anchors.filter, "filter");
        if (preview.result !== "success") {
            throw new Error("Invalid drag anchor filter");
        }
        expect(
            preview.value.evaluate(
                { zoom: 0 },
                {
                    type: "Point",
                    properties: {
                        imageId: DRAGGED_IMAGE_ID,
                        markerAnchor: true,
                        markerSelected: true,
                    },
                },
            ),
        ).to.equal(true);
    });

    it("scales the thumbnail and its outline together", () => {
        const layers = getImagesLayers(
            null,
            "#123456",
            "#345678",
            "#567890",
            "#ffffff",
        );
        const image = layers.find(({ id }) => id === imageLayerIds.thumbnails);
        expect(
            (OUTLINED_MAP_THUMBNAIL_SIZE * THUMBNAIL_IMAGE_SIZE) /
                MAP_THUMBNAIL_SIZE,
        ).to.equal(THUMBNAIL_IMAGE_SIZE + 4);
        const parsed = createExpression(
            image?.type === "symbol" ? image.layout?.["icon-size"] : undefined,
            "thumbnail-size",
        );
        if (parsed.result !== "success") {
            throw new Error("Invalid thumbnail size expression");
        }
        for (const scale of [0.9, 1, 1.1]) {
            expect(
                parsed.value.evaluate(
                    { zoom: 0 },
                    { type: "Point", properties: { markerScale: scale } },
                ),
            ).to.be.closeTo(
                (THUMBNAIL_IMAGE_SIZE / MAP_THUMBNAIL_SIZE) * scale,
                0.00001,
            );
        }
    });

    it("accepts canvas badge and separate drag-preview layers", () => {
        expect(
            validateStyleMin({
                version: 8,
                glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
                sources: {
                    [imageSourceIds.thumbnails]: {
                        type: "geojson",
                        data: { type: "FeatureCollection", features: [] },
                    },
                    [imageSourceIds.dragPreview]: {
                        type: "geojson",
                        data: { type: "FeatureCollection", features: [] },
                    },
                },
                layers: [
                    ...getImagesLayers(
                        null,
                        "#123456",
                        "#345678",
                        "#567890",
                        "#ffffff",
                    ),
                    ...getImageDragPreviewLayers("#123456"),
                ],
            }),
        ).to.deep.equal([]);
    });

    it("does not display the drag preview as a full-size playback image", () => {
        const layers = getImagesLayers(
            null,
            "#123456",
            "#345678",
            "#567890",
            "#ffffff",
        );
        expect(
            layers.findIndex(({ id }) => id === imageLayerIds.countBadge),
        ).to.be.lessThan(
            layers.findIndex(({ id }) => id === imageLayerIds.imageInDisplay),
        );
        const layer = layers.find(
            ({ id }) => id === imageLayerIds.imageInDisplay,
        );
        expect(
            layer && "filter" in layer ? layer.filter : undefined,
        ).not.to.deep.equal(["==", ["get", "imageId"], DRAGGED_IMAGE_ID]);
    });

    it("keeps anchors map-aligned and moves the photo, border, and badge together toward viewport top", () => {
        const layers = getImagesLayers(
            null,
            "#123456",
            "#345678",
            "#567890",
            "#ffffff",
        );
        const anchor = layers.find(({ id }) => id === imageLayerIds.anchors);
        const image = layers.find(({ id }) => id === imageLayerIds.thumbnails);
        const outline = layers.find(
            ({ id }) => id === imageLayerIds.thumbnailsSelectedOutline,
        );
        const badge = layers.find(({ id }) => id === imageLayerIds.countBadge);
        expect(
            anchor?.type === "symbol" &&
                anchor.layout?.["icon-pitch-alignment"],
        ).to.equal("map");
        expect(
            anchor?.type === "symbol" &&
                anchor.layout?.["icon-rotation-alignment"],
        ).to.equal("map");
        expect(
            image?.type === "symbol" && image.paint?.["icon-translate"],
        ).to.deep.equal([0, 0]);
        expect(
            image?.type === "symbol" && image.paint?.["icon-translate-anchor"],
        ).to.equal("viewport");
        expect(
            outline?.type === "symbol" && outline.paint?.["icon-translate"],
        ).to.deep.equal([0, 0]);
        expect(
            badge?.type === "symbol" && badge.layout?.["icon-offset"],
        ).to.deep.equal([20, -20]);
        expect(
            badge?.type === "symbol" && badge.paint?.["icon-translate"],
        ).to.equal(undefined);
        for (const layer of [image, outline, badge]) {
            expect(
                layer?.type === "symbol" &&
                    layer.layout?.["icon-pitch-alignment"],
            ).to.equal("viewport");
            expect(
                layer?.type === "symbol" &&
                    layer.layout?.["icon-rotation-alignment"],
            ).to.equal("viewport");
        }
        expect(
            layers.some(
                (layer) =>
                    layer.type === "symbol" && layer.layout?.["text-field"],
            ),
        ).to.equal(false);
        expect(
            -MAP_IMAGE_MARKER_OFFSET_Y -
                THUMBNAIL_IMAGE_SIZE / 2 -
                2 -
                MAP_IMAGE_ANCHOR_SIDE,
        ).to.equal(MAP_IMAGE_ANCHOR_GAP);
    });
});
