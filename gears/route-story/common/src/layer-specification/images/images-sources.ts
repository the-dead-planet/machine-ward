import { FeatureStateProps, LoadedImageData } from "@apparatus";
import { GeoJson } from "@tinker-chest";
import { getIconImageId, getRouteLngLatAtDistanceFraction, RouteGeometryData, RoutePlacement } from "../../tinkers";

export const IMAGE_ANIMATION_DURATION = 250;
export const IMAGE_PROPERTY = "iconImageId";
export const IMAGE_THUMBNAIL_PROPERTY = "iconImageThumbnailId";
export const DRAGGED_IMAGE_ID = -1;

export type ImageFeature = GeoJSON.Feature<GeoJSON.Point, ImageFeatureProperties>;
export interface ImageFeatureProperties {
    imageId: number;
    distanceFromStartMeters: number;
    markerVisible?: boolean;
    markerCount?: number;
    markerGroupSize?: number;
    markerOpacity?: number;
    markerScale?: number;
    markerRevealScale?: number;
    markerCenter?: [number, number];
    markerOffsetY?: number;
    markerSelected?: boolean;
    markerAnchor?: boolean;
    markerGroupId?: number;
    markerExpanded?: boolean;
    markerSlot?: number;
    [IMAGE_PROPERTY]: string;
    [IMAGE_THUMBNAIL_PROPERTY]: string;
    [FeatureStateProps.Highlight]?: boolean;
    [FeatureStateProps.Dragging]?: boolean;
}

export interface ImageGroupPagination {
    lngLat: [number, number];
    offset: number;
    totalCount: number;
    hiddenCount: number;
}

export interface ImageMarkerSource
    extends GeoJSON.FeatureCollection<GeoJSON.Point, ImageFeatureProperties> {
    pagination?: ImageGroupPagination;
}

export function getImageSource<TImageData>(
    loadedImages: LoadedImageData<TImageData>[],
    geojson?: GeoJson,
    routeGeometryData?: RouteGeometryData | null,
): ImageMarkerSource {
    if (!geojson || !routeGeometryData) {
        return {
            type: "FeatureCollection",
            features: [],
        };
    }

    return {
        type: "FeatureCollection",
        features: loadedImages.map((image) => {
            const lngLat = getRouteLngLatAtDistanceFraction(geojson, routeGeometryData, image.distanceFraction);

            return {
                type: "Feature",
                id: image.id,
                geometry: {
                    type: "Point",
                    coordinates: [lngLat.lng, lngLat.lat],
                },
                properties: {
                    imageId: image.id,
                    distanceFromStartMeters:
                        image.distanceFraction *
                        routeGeometryData.totalDistanceMeters,
                    markerVisible: true,
                    markerCount: 1,
                    markerOpacity: 1,
                    [IMAGE_PROPERTY]: getIconImageId(image),
                    [IMAGE_THUMBNAIL_PROPERTY]: getIconImageId(image, {
                        thumbnail: true,
                    }),
                },
            };
        }),
    };
}

export function getImageSourceWithMarkerVisibility(
    source: ImageMarkerSource,
    visible: boolean,
): typeof source {
    return visible ? source : {
        ...source,
        features: source.features.map((feature) => ({ ...feature, properties: { ...feature.properties, markerVisible: false } })),
    };
}

export const getImageMarkerFeatureId = (imageId: number | string): number => Math.abs(Number(imageId)) * 2 + 1;
export const getImageMarkerAnchorId = (imageId: number | string): number => getImageMarkerFeatureId(imageId) + 1;

export function getImageSourceWithAnchors(original: ImageMarkerSource, grouped: ImageMarkerSource, highlightedIds?: ReadonlySet<string>): ImageMarkerSource {
    const coordinates = new Map(original.features.map((feature) => [feature.properties.imageId, feature.geometry]));
    return {
        ...grouped,
        features: grouped.features.flatMap((feature) => {
            const properties: ImageFeatureProperties = {
                ...feature.properties,
                [FeatureStateProps.Highlight]: !!(feature.properties.markerSelected || feature.properties[FeatureStateProps.Highlight] || highlightedIds?.has(String(feature.properties.imageId))),
            };
            return [{
                ...feature,
                properties,
                id: getImageMarkerFeatureId(feature.properties.imageId),
                geometry: feature.properties.markerCenter
                    ? { type: 'Point', coordinates: feature.properties.markerCenter }
                    : feature.geometry,
            }, {
                ...feature,
                id: getImageMarkerAnchorId(feature.properties.imageId),
                geometry: feature.properties.markerGroupSize === 1
                    ? feature.geometry
                    : coordinates.get(feature.properties.imageId) ?? feature.geometry,
                properties: {
                    ...properties,
                    markerAnchor: true,
                },
            }];
        }),
    };
}

export function getImageDragPreviewSource(
    source: GeoJSON.FeatureCollection<GeoJSON.Point, ImageFeatureProperties>,
    imageId: number | null,
    placement: RoutePlacement | null,
): typeof source {
    const image = source.features.find((feature) => feature.properties.imageId === imageId);
    if (!image || !placement) {
        return { type: "FeatureCollection", features: [] };
    }
    const preview: typeof source = {
        ...source,
        features: [
            {
                ...image,
                id: DRAGGED_IMAGE_ID,
                geometry: {
                    type: "Point",
                    coordinates: [placement.lngLat.lng, placement.lngLat.lat],
                },
                properties: {
                    ...image.properties,
                    imageId: DRAGGED_IMAGE_ID,
                    markerVisible: false,
                    markerSelected: true,
                    markerCenter: undefined,
                    [FeatureStateProps.Highlight]: true,
                },
            },
        ],
    };
    return getImageSourceWithAnchors(preview, preview);
}
