import { LayerSpecification } from "maplibre-gl";
import { imageLayerIds, ImagesLayers, imageSourceIds } from "@the-dead-planet/machine-ward-gears-route-story-common";

export const getImagesLayers = (
    displayImageId: number | null,
    defaultColor: string,
    hoverColor: string,
    activeColor: string,
    badgeTextColor: string,
): LayerSpecification[] => {
    return [
        {
            id: imageLayerIds.anchors,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            filter: ImagesLayers.anchorsUnselected.filter,
            layout: ImagesLayers.anchors.layout,
            paint: ImagesLayers.anchors.getPaint(defaultColor, hoverColor, activeColor),
        },
        {
            id: imageLayerIds.thumbnailsStackBack,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            ...ImagesLayers.thumbnailsStackBack,
        },
        {
            id: imageLayerIds.thumbnailsStackFront,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            ...ImagesLayers.thumbnailsStackFront,
        },
        {
            id: imageLayerIds.thumbnails,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            filter: ImagesLayers.thumbnailsOutlined.filter,
            layout: ImagesLayers.thumbnailsOutlined.getLayout(defaultColor, hoverColor),
            paint: ImagesLayers.thumbnailsOutlined.paint,
        },
        {
            id: imageLayerIds.countBadge,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            filter: ImagesLayers.countBadge.filter,
            layout: ImagesLayers.countBadge.getLayout(defaultColor, badgeTextColor),
            paint: ImagesLayers.countBadge.paint,
        },
        {
            id: imageLayerIds.anchorsSelected,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            filter: ImagesLayers.anchorsSelected.filter,
            layout: ImagesLayers.anchorsSelected.layout,
            paint: ImagesLayers.anchorsSelected.getPaint(defaultColor, hoverColor, activeColor),
        },
        {
            id: imageLayerIds.thumbnailsSelectedOutline,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            filter: ImagesLayers.thumbnailsSelectedOutline.filter,
            layout: ImagesLayers.thumbnailsSelectedOutline.layout,
            paint: ImagesLayers.thumbnailsSelectedOutline.getPaint(defaultColor, hoverColor, activeColor),
        },
        {
            id: imageLayerIds.thumbnailsSelected,
            source: imageSourceIds.thumbnails,
            type: "symbol",
            filter: ImagesLayers.thumbnailsSelected.filter,
            layout: ImagesLayers.thumbnailsSelected.layout,
            paint: ImagesLayers.thumbnailsSelected.paint,
        },
        {
            id: imageLayerIds.imageInDisplay,
            type: "symbol",
            filter: ImagesLayers.imageInDisplay.getFilter(displayImageId),
            source: imageSourceIds.thumbnails,
            layout: ImagesLayers.imageInDisplay.layout,
        },
    ];
};

export const getImageDragPreviewLayers = (
    highlightColor: string,
): LayerSpecification[] => [
    {
        id: imageLayerIds.dragAnchor,
        source: imageSourceIds.dragPreview,
        type: "symbol",
        filter: ImagesLayers.anchors.filter,
        layout: ImagesLayers.anchors.layout,
        paint: ImagesLayers.anchors.getPaint(highlightColor, highlightColor, highlightColor),
    },
    {
        id: imageLayerIds.thumbnailsHighlightOutline,
        source: imageSourceIds.dragPreview,
        type: "symbol",
        filter: ImagesLayers.thumbnailsHighlightOutline.filter,
        layout: ImagesLayers.thumbnailsHighlightOutline.layout,
        paint: ImagesLayers.thumbnailsHighlightOutline.getPaint(highlightColor),
    },
    {
        id: imageLayerIds.thumbnailsHighlight,
        source: imageSourceIds.dragPreview,
        type: "symbol",
        filter: ImagesLayers.thumbnailsHighlight.filter,
        layout: ImagesLayers.thumbnailsHighlight.layout,
        paint: ImagesLayers.thumbnailsHighlight.paint,
    },
];
