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
export const selectedImageId$ = new BehaviorSubject<number | null>(null);
export const IMAGE_MARKER_ANCHOR_ID = "route-story-image-anchor-hexagon";
export const IMAGE_MARKER_OUTLINE_ID = "route-story-image-outline-circle";
const thumbnailTranslate: [number, number] = [0, 0];
const dragThumbnailTranslate: [number, number] = [
    0,
    MAP_IMAGE_MARKER_OFFSET_Y - (THUMBNAIL_IMAGE_SIZE * 0.1) / 2,
];
const countText: ExpressionSpecification = [
    "case",
    [">", ["get", "markerCount"], 9],
    "9+",
    ["to-string", ["get", "markerCount"]],
];
export const expandedImageGroupId$ = new BehaviorSubject<number | null>(null);
export const imageGroupOffset$ = new BehaviorSubject(0);

export const shiftImageGroup = (
    pagination: ImageGroupPagination,
    direction: number,
): void => {
    imageGroupOffset$.next(
        (((imageGroupOffset$.value - direction) % pagination.totalCount) +
            pagination.totalCount) %
            pagination.totalCount,
    );
};

export const clearImageMarkerSelection = (): void => {
    selectedImageId$.next(null);
    expandedImageGroupId$.next(null);
    imageGroupOffset$.next(0);
};

export const toggleImageMarkerGroup = (imageIds: number[]) => {
    if (!imageIds.length) {
        return;
    }
    if (imageIds.some((id) => id === selectedImageId$.value)) {
        clearImageMarkerSelection();
        return;
    }
    const imageId = imageIds[0];
    imageGroupOffset$.next(0);
    selectedImageId$.next(imageId);
    expandedImageGroupId$.next(imageId);
};

export const selectMapImageMarker = (
    imageId: number,
    groupSize: number,
    groupId = imageId,
) => {
    if (expandedImageGroupId$.value !== groupId || groupSize <= 1) {
        imageGroupOffset$.next(0);
    }
    selectedImageId$.next(groupSize > 1 || selectedImageId$.value !== imageId ? imageId : null);
    expandedImageGroupId$.next(groupSize > 1 ? groupId : null);
};

const thumbnailsFilter: FilterSpecification = [
    "all",
    ["!=", ["get", "markerAnchor"], true],
    ["!=", ["get", "imageId"], DRAGGED_IMAGE_ID],
    ["==", ["get", "markerVisible"], true],
];
const groupFilter: FilterSpecification = [
    "all",
    thumbnailsFilter,
    [">", ["get", "markerCount"], 1],
];
const thumbnailIconImage: GetProperty = ["get", IMAGE_THUMBNAIL_PROPERTY];
const thumbnailIconSize: number = getImageIconSize(MAP_THUMBNAIL_SIZE, THUMBNAIL_IMAGE_SIZE);
const thumbnailScale: ExpressionSpecification = [
    "coalesce",
    ["get", "markerScale"],
    1,
];
const scaledThumbnailIconSize: ExpressionSpecification = [
    "*",
    thumbnailIconSize,
    thumbnailScale,
];
const thumbnailDiameter: ExpressionSpecification = [
    "*",
    THUMBNAIL_IMAGE_SIZE,
    thumbnailScale,
];
const thumbnailBorderDiameter: ExpressionSpecification = [
    "case",
    ["==", ["get", "markerSelected"], true],
    6,
    MAP_IMAGE_MARKER_OUTLINE_WIDTH * 2,
];
const thumbnailOutlineDiameter: ExpressionSpecification = [
    "+",
    thumbnailDiameter,
    thumbnailBorderDiameter,
];
const thumbnailBottomOffset = (
    diameter: ExpressionSpecification,
    baseDiameter: number | ExpressionSpecification,
): ExpressionSpecification => [
    "case",
    ["==", ["get", "markerGroupSize"], 1],
    [
        "interpolate",
        ["linear"],
        ["/", baseDiameter, diameter],
        0,
        ["literal", [0, -MAP_THUMBNAIL_SIZE / 2]],
        2,
        ["literal", [0, MAP_THUMBNAIL_SIZE / 2]],
    ],
    ["literal", [0, 0]],
];
const dragOpacity = 0.4;
const thumbnailDraggingOpacity: ExpressionSpecification = [
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
];
const thumbnailsOutlineStrokeColor = (
    defaultColor: string,
    hoverColor: string,
    activeColor: string,
): ExpressionSpecification => [
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
];

const thumbnailsHighlightFilter: FilterSpecification = [
    "all",
    ["==", ["get", "imageId"], DRAGGED_IMAGE_ID],
    ["!=", ["get", "markerAnchor"], true],
];

const inDisplayIconImage: GetProperty = ["get", IMAGE_PROPERTY];

const thumbnailsStackBack: Pick<SymbolLayerSpecification, "filter" | "layout" | "paint"> = {
    filter: groupFilter,
    layout: {
        "icon-image": thumbnailIconImage,
        "icon-size": thumbnailIconSize,
        "icon-allow-overlap": true,
    },
    paint: {
        "icon-translate": [8, -8],
        "icon-translate-anchor": "viewport",
        "icon-opacity": 0.4,
    },
};
const thumbnailsStackFront: typeof thumbnailsStackBack = {
    ...thumbnailsStackBack,
    paint: {
        ...thumbnailsStackBack.paint,
        "icon-translate": [4, -4],
        "icon-opacity": 0.7,
    },
};

const anchorLayout: NonNullable<SymbolLayerSpecification["layout"]> = {
    "icon-image": IMAGE_MARKER_ANCHOR_ID,
    "icon-size": 1,
    "icon-allow-overlap": true,
    "icon-pitch-alignment": "map",
    "icon-rotation-alignment": "map",
};
const thumbnailPaint: NonNullable<SymbolLayerSpecification["paint"]> = {
    "icon-opacity": thumbnailDraggingOpacity,
    "icon-translate": thumbnailTranslate,
    "icon-translate-anchor": "viewport",
};
const thumbnailViewportLayout: NonNullable<SymbolLayerSpecification["layout"]> =
    {
        "icon-allow-overlap": true,
        "icon-pitch-alignment": "viewport",
        "icon-rotation-alignment": "viewport",
    };
const thumbnailOutlineLayout: NonNullable<SymbolLayerSpecification["layout"]> =
    {
        ...thumbnailViewportLayout,
        "icon-image": IMAGE_MARKER_OUTLINE_ID,
        "icon-size": ["/", thumbnailOutlineDiameter, MAP_THUMBNAIL_SIZE],
        "icon-offset": thumbnailBottomOffset(thumbnailOutlineDiameter, [
            "+",
            THUMBNAIL_IMAGE_SIZE,
            thumbnailBorderDiameter,
        ]),
    };
const countBadgePaint: NonNullable<SymbolLayerSpecification["paint"]> = {
    "icon-opacity": 1,
};
const selectedThumbnailsFilter: FilterSpecification = [
    "all",
    thumbnailsFilter,
    ["==", ["get", "markerSelected"], true],
];
const unselectedThumbnailsFilter: FilterSpecification = [
    "all",
    thumbnailsFilter,
    ["!=", ["get", "markerSelected"], true],
];
const thumbnailsOutline = {
    filter: unselectedThumbnailsFilter,
    layout: thumbnailOutlineLayout,
    getPaint: (
        defaultColor: string,
        hoverColor: string,
        activeColor: string,
    ): NonNullable<SymbolLayerSpecification["paint"]> => ({
        ...thumbnailPaint,
        "icon-color": thumbnailsOutlineStrokeColor(defaultColor, hoverColor, activeColor),
    }),
};
const thumbnails = {
    filter: unselectedThumbnailsFilter,
    layout: {
        ...thumbnailViewportLayout,
        "icon-image": thumbnailIconImage,
        "icon-size": scaledThumbnailIconSize,
        "icon-offset": thumbnailBottomOffset(thumbnailDiameter, THUMBNAIL_IMAGE_SIZE),
    },
    paint: thumbnailPaint,
};
const anchorsFilter: FilterSpecification = [
    "all",
    ["==", ["get", "markerAnchor"], true],
    [
        "any",
        ["==", ["get", "markerVisible"], true],
        ["==", ["get", "imageId"], DRAGGED_IMAGE_ID],
    ],
];
const anchors = {
    filter: anchorsFilter,
    layout: anchorLayout,
    getPaint: (
        defaultColor: string,
        hoverColor: string,
        activeColor: string,
    ): NonNullable<SymbolLayerSpecification["paint"]> => ({
        "icon-color": thumbnailsOutlineStrokeColor(defaultColor, hoverColor, activeColor),
        "icon-opacity": thumbnailDraggingOpacity,
    }),
};
const unselectedAnchorsFilter: FilterSpecification = [
    "all",
    anchorsFilter,
    ["!=", ["get", "markerSelected"], true],
];
const selectedAnchorsFilter: FilterSpecification = [
    "all",
    anchorsFilter,
    ["==", ["get", "markerSelected"], true],
];

export default {
    connections: {
        getPaint: (
            defaultColor: string,
            hoverColor: string,
            activeColor: string,
            selectedImageId: number | null,
        ): NonNullable<LineLayerSpecification["paint"]> => ({
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
        }),
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
        ): NonNullable<SymbolLayerSpecification["layout"]> => ({
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
        }),
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
        ): NonNullable<SymbolLayerSpecification["paint"]> => ({
            "icon-color": highlightColor,
            "icon-translate": dragThumbnailTranslate,
            "icon-translate-anchor": "viewport",
        }),
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
        ): NonNullable<SymbolLayerSpecification["layout"]> => ({
            ...thumbnailViewportLayout,
            "icon-image": [
                "concat",
                getImageCountBadgeImageName("", backgroundColor, textColor),
                countText,
            ],
            "icon-size": 1,
            "icon-offset": MAP_IMAGE_COUNT_BADGE_OFFSET,
            "icon-allow-overlap": true,
        }),
        paint: countBadgePaint,
    },
    imageInDisplay: {
        getFilter: (displayImageId: number | null): FilterSpecification => [
            "all",
            ["==", ["get", "imageId"], displayImageId ?? ""],
            ["==", ["get", "markerAnchor"], true],
        ],
        layout: {
            "icon-image": inDisplayIconImage,
            "icon-size": getImageIconSize(FULL_SIZE_IMAGE_SIZE, THUMBNAIL_IMAGE_SIZE),
            "icon-allow-overlap": true,
        },
    },
};
