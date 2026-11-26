import { FeatureStateProps } from "@apparatus";
import { DRAGGED_IMAGE_ID, IMAGE_PROPERTY, IMAGE_THUMBNAIL_PROPERTY, ImageGroupPagination } from "./images-sources";
import {
    getImageIconSize,
    FULL_SIZE_IMAGE_SIZE,
    THUMBNAIL_IMAGE_SIZE,
    MAP_THUMBNAIL_SIZE,
    MAP_IMAGE_MARKER_OFFSET_Y,
    MAP_IMAGE_COUNT_BADGE_OFFSET,
    MAP_IMAGE_MARKER_OUTLINE_WIDTH,
} from "../../tinkers/images";
import { GetProperty } from "../model";
import { BehaviorSubject } from "rxjs";
import type { RoutePlacement } from "../../tinkers";
import { getImageCountBadgeImageName } from "./image-count-badges";
import type { ExpressionSpecification, FilterSpecification, SymbolLayerSpecification, LineLayerSpecification } from "@maplibre/maplibre-gl-style-spec";

export const imageSourceIds = {
    dragPreview: "route-story-image-drag-preview",
    connections: "route-story-image-connections",
    thumbnails: "route-story-thumbnails",
};

/**
 * Keys follow layer order.
 */
export const imageLayerIds = {
    connections: "route-story-image-connections",
    anchors: "route-story-image-anchors",
    thumbnailsStackBack: "route-story-thumbnails-stack-back",
    thumbnailsStackFront: "route-story-thumbnails-stack-front",
    thumbnailsOutline: "route-story-thumbnails-outline",
    thumbnails: "route-story-thumbnails",
    countBadge: "route-story-image-count-badge",
    anchorsSelected: "route-story-image-anchors-selected",
    thumbnailsSelectedOutline: "route-story-thumbnails-selected-outline",
    thumbnailsSelected: "route-story-thumbnails-selected",
    dragAnchor: "route-story-image-drag-anchor",
    thumbnailsHighlightOutline: "route-story-thumbnails-highlight-outline",
    thumbnailsHighlight: "route-story-thumbnails-highlight",
    imageInDisplay: "route-story-image-in-display",
};

export const highlightIdsBySourceId$ = new BehaviorSubject<Map<string, Set<string>>>(new Map());
export const draggingImage$ = new BehaviorSubject<{
    interaction: "map" | "player";
    id: number;
} | null>(null);
export const draggingPlacement$ = new BehaviorSubject<RoutePlacement | null>(null);
export const IMAGE_MARKER_ANCHOR_ID = "route-story-image-anchor-hexagon";
export const IMAGE_MARKER_OUTLINE_ID = "route-story-image-outline-circle";
const thumbnailTranslate: [number, number] = [0, 0];
const dragThumbnailTranslate: [number, number] = [
    0,
    MAP_IMAGE_MARKER_OFFSET_Y - (THUMBNAIL_IMAGE_SIZE * 0.1) / 2,
];
const countText = [
    "case",
    [">", ["get", "markerCount"], 9],
    "9+",
    ["to-string", ["get", "markerCount"]],
] satisfies ExpressionSpecification;

const thumbnailsFilter = [
    "all",
    ["!=", ["get", "markerAnchor"], true],
    ["!=", ["get", "imageId"], DRAGGED_IMAGE_ID],
    ["==", ["get", "markerVisible"], true],
] satisfies FilterSpecification;
const groupFilter = [
    "all",
    thumbnailsFilter,
    [">", ["get", "markerCount"], 1],
] satisfies FilterSpecification;
const thumbnailIconImage: GetProperty = ["get", IMAGE_THUMBNAIL_PROPERTY];
const thumbnailIconSize: number = getImageIconSize(MAP_THUMBNAIL_SIZE, THUMBNAIL_IMAGE_SIZE);
const thumbnailScale = [
    "*",
    ["coalesce", ["get", "markerScale"], 1],
    ["coalesce", ["get", "markerRevealScale"], 1],
] satisfies ExpressionSpecification;
const scaledThumbnailIconSize = [
    "*",
    thumbnailIconSize,
    thumbnailScale,
] satisfies ExpressionSpecification;
const thumbnailDiameter = [
    "*",
    THUMBNAIL_IMAGE_SIZE,
    thumbnailScale,
] satisfies ExpressionSpecification;
const thumbnailBorderDiameter = [
    "case",
    ["==", ["get", "markerSelected"], true],
    6,
    MAP_IMAGE_MARKER_OUTLINE_WIDTH * 2,
] satisfies ExpressionSpecification;
const thumbnailOutlineDiameter = [
    "+",
    thumbnailDiameter,
    ["*", thumbnailBorderDiameter, ["coalesce", ["get", "markerRevealScale"], 1]],
] satisfies ExpressionSpecification;
const thumbnailOffset = (
    diameter: typeof thumbnailDiameter | typeof thumbnailOutlineDiameter,
    baseDiameter: number | ["+", number, typeof thumbnailBorderDiameter],
) => [
    "interpolate",
    ["linear"],
    [
        "/",
        ["+", ["coalesce", ["get", "markerOffsetY"], MAP_IMAGE_MARKER_OFFSET_Y], ["case", ["==", ["get", "markerGroupSize"], 1], ["/", ["-", baseDiameter, diameter], 2], 0]],
        ["max", diameter, 0.00001],
    ],
    -1,
    ["literal", [0, -MAP_THUMBNAIL_SIZE]],
    1,
    ["literal", [0, MAP_THUMBNAIL_SIZE]],
] satisfies ExpressionSpecification;
const dragOpacity = 0.4;
const thumbnailDraggingOpacity = [
    "*",
    ["coalesce", ["get", "markerOpacity"], 1],
    [
        "case",
        [
            "any",
            ["==", ["feature-state", FeatureStateProps.Dragging], true],
            ["==", ["get", FeatureStateProps.Dragging], true],
        ],
        dragOpacity,
        1,
    ],
] satisfies ExpressionSpecification;
const thumbnailsOutlineStrokeColor = (
    defaultColor: string,
    hoverColor: string,
    activeColor: string,
) => [
    "case",
    [
        "any",
        ["==", ["get", "markerSelected"], true],
        ["==", ["feature-state", FeatureStateProps.Dragging], true],
        ["==", ["get", FeatureStateProps.Dragging], true],
    ],
    activeColor,
    [
        "any",
        ["==", ["feature-state", FeatureStateProps.Highlight], true],
        ["==", ["get", FeatureStateProps.Highlight], true],
    ],
    hoverColor,
    defaultColor,
] satisfies ExpressionSpecification;

const thumbnailsHighlightFilter = [
    "all",
    ["==", ["get", "imageId"], DRAGGED_IMAGE_ID],
    ["!=", ["get", "markerAnchor"], true],
] satisfies FilterSpecification;

const inDisplayIconImage: GetProperty = ["get", IMAGE_PROPERTY];

const thumbnailsStackBack = {
    filter: groupFilter,
    layout: {
        "icon-image": thumbnailIconImage,
        "icon-size": thumbnailIconSize,
        "icon-offset": [0, MAP_IMAGE_MARKER_OFFSET_Y / thumbnailIconSize],
        "icon-allow-overlap": true,
    },
    paint: {
        "icon-translate": [8, -8],
        "icon-translate-anchor": "viewport",
        "icon-opacity": 0.4,
    },
} satisfies Pick<SymbolLayerSpecification, "filter" | "layout" | "paint">;
const thumbnailsStackFront: typeof thumbnailsStackBack = {
    ...thumbnailsStackBack,
    paint: {
        ...thumbnailsStackBack.paint,
        "icon-translate": [4, -4],
        "icon-opacity": 0.7,
    },
};

const anchorLayout = {
    "icon-image": IMAGE_MARKER_ANCHOR_ID,
    "icon-size": 1,
    "icon-allow-overlap": true,
    "icon-pitch-alignment": "map",
    "icon-rotation-alignment": "map",
} satisfies NonNullable<SymbolLayerSpecification["layout"]>;
const thumbnailPaint = {
    "icon-opacity": thumbnailDraggingOpacity,
    "icon-translate": thumbnailTranslate,
    "icon-translate-anchor": "viewport",
} satisfies NonNullable<SymbolLayerSpecification["paint"]>;
const thumbnailViewportLayout =
    {
        "icon-allow-overlap": true,
        "icon-pitch-alignment": "viewport",
        "icon-rotation-alignment": "viewport",
    } satisfies NonNullable<SymbolLayerSpecification["layout"]>;
const thumbnailOutlineLayout =
    {
        ...thumbnailViewportLayout,
        "icon-image": IMAGE_MARKER_OUTLINE_ID,
        "icon-size": ["/", thumbnailOutlineDiameter, MAP_THUMBNAIL_SIZE],
        "icon-offset": thumbnailOffset(thumbnailOutlineDiameter, [
            "+",
            THUMBNAIL_IMAGE_SIZE,
            thumbnailBorderDiameter,
        ]),
    } satisfies NonNullable<SymbolLayerSpecification["layout"]>;
const countBadgePaint = {
    "icon-opacity": 1,
} satisfies NonNullable<SymbolLayerSpecification["paint"]>;
const selectedThumbnailsFilter = [
    "all",
    thumbnailsFilter,
    ["==", ["get", "markerSelected"], true],
] satisfies FilterSpecification;
const unselectedThumbnailsFilter = [
    "all",
    thumbnailsFilter,
    ["!=", ["get", "markerSelected"], true],
] satisfies FilterSpecification;
const thumbnailsOutline = {
    filter: unselectedThumbnailsFilter,
    layout: thumbnailOutlineLayout,
    getPaint: (
        defaultColor: string,
        hoverColor: string,
        activeColor: string,
    ) => ({
        ...thumbnailPaint,
        "icon-color": thumbnailsOutlineStrokeColor(defaultColor, hoverColor, activeColor),
    } satisfies NonNullable<SymbolLayerSpecification["paint"]>),
};
const thumbnails = {
    filter: unselectedThumbnailsFilter,
    layout: {
        ...thumbnailViewportLayout,
        "icon-image": thumbnailIconImage,
        "icon-size": scaledThumbnailIconSize,
        "icon-offset": thumbnailOffset(thumbnailDiameter, THUMBNAIL_IMAGE_SIZE),
    },
    paint: thumbnailPaint,
};
const anchorsFilter = [
    "all",
    ["==", ["get", "markerAnchor"], true],
    [
        "any",
        ["==", ["get", "markerVisible"], true],
        ["==", ["get", "imageId"], DRAGGED_IMAGE_ID],
    ],
] satisfies FilterSpecification;
const anchors = {
    filter: anchorsFilter,
    layout: anchorLayout,
    getPaint: (
        defaultColor: string,
        hoverColor: string,
        activeColor: string,
    ) => ({
        "icon-color": thumbnailsOutlineStrokeColor(defaultColor, hoverColor, activeColor),
        "icon-opacity": thumbnailDraggingOpacity,
    } satisfies NonNullable<SymbolLayerSpecification["paint"]>),
};
const unselectedAnchorsFilter = [
    "all",
    anchorsFilter,
    ["!=", ["get", "markerSelected"], true],
] satisfies FilterSpecification;
const selectedAnchorsFilter = [
    "all",
    anchorsFilter,
    ["==", ["get", "markerSelected"], true],
] satisfies FilterSpecification;

export default {
    connections: {
        getPaint: (
            defaultColor: string,
            hoverColor: string,
            activeColor: string,
            selectedImageId: number | null,
        ) => ({
            "line-color": [
                "case",
                ["==", ["get", "imageId"], selectedImageId ?? DRAGGED_IMAGE_ID],
                activeColor,
                ["==", ["feature-state", FeatureStateProps.Highlight], true],
                hoverColor,
                defaultColor,
            ],
            "line-width": 1,
            "line-dasharray": [2, 2],
        } satisfies NonNullable<LineLayerSpecification["paint"]>),
    },
    thumbnailsStackBack,
    thumbnailsStackFront,
    anchors,
    anchorsUnselected: {
        ...anchors,
        filter: unselectedAnchorsFilter,
    },
    anchorsSelected: {
        ...anchors,
        filter: selectedAnchorsFilter,
    },
    thumbnailsOutline,
    thumbnails,
    thumbnailsOutlined: {
        filter: unselectedThumbnailsFilter,
        getLayout: (
            defaultColor: string,
            hoverColor: string,
        ) => ({
            ...thumbnails.layout,
            "icon-image": [
                "concat",
                thumbnailIconImage,
                ":outline:",
                [
                    "case",
                    ["==", ["get", FeatureStateProps.Highlight], true],
                    hoverColor,
                    defaultColor,
                ],
            ],
        } satisfies NonNullable<SymbolLayerSpecification["layout"]>),
        paint: thumbnailPaint,
    },
    thumbnailsSelectedOutline: {
        ...thumbnailsOutline,
        filter: selectedThumbnailsFilter,
    },
    thumbnailsSelected: {
        ...thumbnails,
        filter: selectedThumbnailsFilter,
    },
    thumbnailsHighlightOutline: {
        filter: thumbnailsHighlightFilter,
        layout: {
            ...thumbnailViewportLayout,
            "icon-image": IMAGE_MARKER_OUTLINE_ID,
            "icon-size": (THUMBNAIL_IMAGE_SIZE * 1.1 + 4) / MAP_THUMBNAIL_SIZE,
        },
        getPaint: (
            highlightColor: string,
        ) => ({
            "icon-color": highlightColor,
            "icon-translate": dragThumbnailTranslate,
            "icon-translate-anchor": "viewport",
        } satisfies NonNullable<SymbolLayerSpecification["paint"]>),
    },
    thumbnailsHighlight: {
        filter: thumbnailsHighlightFilter,
        layout: {
            ...thumbnailViewportLayout,
            "icon-image": thumbnailIconImage,
            "icon-size": thumbnailIconSize * 1.1,
            "icon-allow-overlap": true,
        },
        paint: {
            ...thumbnailPaint,
            "icon-opacity": 1,
            "icon-translate": dragThumbnailTranslate,
        },
    },
    countBadge: {
        filter: groupFilter,
        getLayout: (
            backgroundColor: string,
            textColor: string,
        ) => ({
            ...thumbnailViewportLayout,
            "icon-image": [
                "concat",
                getImageCountBadgeImageName("", backgroundColor, textColor),
                countText,
            ],
            "icon-size": 1,
            "icon-offset": [MAP_IMAGE_COUNT_BADGE_OFFSET[0], MAP_IMAGE_MARKER_OFFSET_Y + MAP_IMAGE_COUNT_BADGE_OFFSET[1]],
            "icon-allow-overlap": true,
        } satisfies NonNullable<SymbolLayerSpecification["layout"]>),
        paint: countBadgePaint,
    },
    imageInDisplay: {
        getFilter: (displayImageId: number | null) => [
            "all",
            ["==", ["get", "imageId"], displayImageId ?? ""],
            ["==", ["get", "markerAnchor"], true],
        ] satisfies FilterSpecification,
        layout: {
            "icon-image": inDisplayIconImage,
            "icon-size": getImageIconSize(FULL_SIZE_IMAGE_SIZE, THUMBNAIL_IMAGE_SIZE),
            "icon-allow-overlap": true,
        },
    },
};
