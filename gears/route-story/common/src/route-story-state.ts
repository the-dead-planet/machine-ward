import { defaultRouteStoryState } from "./layer-specification";
import { currentPointIconNames, CurrentPointIconName, RouteStoryState } from "./model";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const mergeKnownFields = <T extends object>(defaults: T, value: unknown): T => {
    const stored = isRecord(value) ? value : {};

    return Object.fromEntries(Object.entries(defaults).map(([key, defaultValue]) => [
        key,
        Object.prototype.hasOwnProperty.call(stored, key) ? stored[key] : defaultValue,
    ])) as T;
};

export const cleanUpRouteStoryState = (value: unknown): RouteStoryState => {
    const stored = isRecord(value) ? value : {};
    const currentPoint = mergeKnownFields(defaultRouteStoryState.currentPoint, stored.currentPoint);
    const imageMarkerStyle = isRecord(stored.imageMarkerStyle)
        ? stored.imageMarkerStyle
        : isRecord(stored.photoMarkers) ? stored.photoMarkers : {};

    return {
        viewportRangePlayerVisibility: typeof stored.viewportRangePlayerVisibility === 'boolean' ? stored.viewportRangePlayerVisibility : defaultRouteStoryState.viewportRangePlayerVisibility,
        markerPlayerVisibility: typeof stored.markerPlayerVisibility === 'boolean' ? stored.markerPlayerVisibility : defaultRouteStoryState.markerPlayerVisibility,
        markerLayerVisibility: typeof stored.markerLayerVisibility === 'boolean' ? stored.markerLayerVisibility : defaultRouteStoryState.markerLayerVisibility,
        imageMarkerStyle: {
            shape: imageMarkerStyle.shape === 'square' || imageMarkerStyle.shape === 'hexagon' ? imageMarkerStyle.shape : 'circle',
            size: imageMarkerStyle.size === 'small' || imageMarkerStyle.size === 'large' ? imageMarkerStyle.size : 'medium',
        },
        routeStyleActive: mergeKnownFields(defaultRouteStoryState.routeStyleActive, stored.routeStyleActive),
        routeStyleInactive: mergeKnownFields(defaultRouteStoryState.routeStyleInactive, stored.routeStyleInactive),
        currentPoint: {
            ...currentPoint,
            icon: currentPointIconNames.includes(currentPoint.icon as CurrentPointIconName) ? currentPoint.icon : 'Circle',
            rotationAlignment: currentPoint.rotationAlignment === 'viewport' ? 'viewport' : 'map',
        },
    };
};
