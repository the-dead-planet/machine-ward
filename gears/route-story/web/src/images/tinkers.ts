import {
    DRAGGED_IMAGE_ID,
    getMapImageThumbnailOffsetY,
    imageLayerIds,
    MAP_IMAGE_MARKER_OFFSET_Y,
    MAP_IMAGE_ANCHOR_SIDE,
    THUMBNAIL_IMAGE_SIZE,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";

interface ImageHitFeature {
    properties: {
        imageId?: number;
        markerAnchor?: boolean;
        markerScale?: number;
        markerGroupSize?: number;
    };
    geometry: GeoJSON.Geometry;
    layer: { id: string };
}

export const findMapImageFeature = <T extends ImageHitFeature>(
    features: T[],
    point: { x: number; y: number },
    project: (coordinate: [number, number]) => { x: number; y: number },
): T | undefined => {
    const candidates = features.filter(
        ({ properties, layer }) =>
            properties.imageId !== DRAGGED_IMAGE_ID &&
            layer.id !== imageLayerIds.thumbnailsOutline &&
            layer.id !== imageLayerIds.thumbnailsSelectedOutline,
    );
    return (
        candidates.find(({ properties, geometry }) => {
            if (geometry.type !== "Point") {
                return false;
            }
            const center = project([
                geometry.coordinates[0],
                geometry.coordinates[1],
            ]);
            if (properties.markerAnchor) {
                return (
                    Math.hypot(point.x - center.x, point.y - center.y) <=
                        MAP_IMAGE_ANCHOR_SIDE + 2
                );
            }
            const offset = getMapImageThumbnailOffsetY(properties.markerGroupSize, properties.markerScale) - MAP_IMAGE_MARKER_OFFSET_Y;
            return (
                Math.hypot(point.x - center.x, point.y - center.y - offset) <=
                (THUMBNAIL_IMAGE_SIZE * (properties.markerScale ?? 1)) / 2
            );
        }) ?? candidates[0]
    );
};
