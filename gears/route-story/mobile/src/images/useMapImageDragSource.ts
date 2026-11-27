import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { GeoJson, useSubjectState } from "@tinker-chest";
import {
    draggingImage$,
    draggingPlacement$,
    getImageSourceWithAnchors,
    getRouteLngLatAtDistanceFraction,
    IMAGE_DRAG_ORIGIN_OPACITY,
    ImageFeature,
    ImageMarkerSource,
    RouteGeometryData,
} from "@the-dead-planet/machine-ward-gears-route-story-common";

const DRAG_ORIGIN_IMAGE_ID = -2;
const emptyOrigin: ImageFeature[] = [];

export const useMapImageDragSource = (source: ImageMarkerSource, originalSource: ImageMarkerSource, geojson: GeoJson | undefined, route: RouteGeometryData | null) => {
    const [image] = useSubjectState(draggingImage$);
    const [placement] = useSubjectState(draggingPlacement$);
    const imageId = image?.interaction === "map" ? image.id : null;
    const [origin, setOrigin] = useState(emptyOrigin);
    const captureOrigin = useEffectEvent((id: number) => {
        const feature = source.features.find(({ properties }) => properties.imageId === id);
        if (!feature) {
            return emptyOrigin;
        }
        const { features } = getImageSourceWithAnchors(originalSource, { ...source, features: [feature] });
        return features.map((item) => ({
            ...item,
            id: undefined,
            properties: {
                ...item.properties,
                imageId: DRAG_ORIGIN_IMAGE_ID,
                markerCount: 1,
                markerOpacity: (item.properties.markerOpacity ?? 1) * IMAGE_DRAG_ORIGIN_OPACITY,
            },
        }));
    });

    useEffect(() => {
        let previousId: number | null = null;
        const subscription = draggingImage$.subscribe((drag) => {
            const id = drag?.interaction === "map" ? drag.id : null;
            if (id !== previousId) {
                previousId = id;
                setOrigin(id === null ? emptyOrigin : captureOrigin(id));
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // Keep the same feature and layer when switching from the drag size to the saved size.
    const dragSource = useMemo((): ImageMarkerSource => {
        if (imageId === null || !placement || !geojson || !route) {
            return source;
        }
        const { distanceFraction } = placement;
        const { lng, lat } = getRouteLngLatAtDistanceFraction(geojson, route, distanceFraction);
        return {
            ...source,
            features: source.features.map((feature) => feature.properties.imageId !== imageId ? feature : {
                ...feature,
                geometry: { type: "Point", coordinates: [lng, lat] },
                properties: {
                    ...feature.properties,
                    distanceFromStartMeters: distanceFraction * route.totalDistanceMeters,
                    markerVisible: true,
                    markerSelected: false,
                    markerExpanded: false,
                    markerCenter: undefined,
                    markerOffsetY: undefined,
                    markerCount: 1,
                    markerGroupSize: 1,
                    markerOpacity: 1,
                    markerScale: 1.1,
                    markerRevealScale: undefined,
                },
            }),
        };
    }, [source, imageId, placement, geojson, route]);

    return { dragSource, dragOrigin: dragSource === source ? emptyOrigin : origin };
};
