import { useEffect, useMemo, useRef } from "react";
import type * as maplibregl from "maplibre-gl";
import { GeoJson, useSubjectState } from "@tinker-chest";
import { MapDataHandlers } from "@web-apparatus";
import {
    clearImageMarkerSelection,
    draggingImage$,
    draggingPlacement$,
    DRAGGED_IMAGE_ID,
    getRoutePlacement,
    highlightIdsBySourceId$,
    ImageMarkerSource,
    imageSourceIds,
    RouteGeometryData,
    selectMapImageMarker,
    updateImageDistanceFraction,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { useLoadedWebImages } from "../hooks/useLoadedWebImages";
import { WebRouteStoryProps } from "../model";
import { findMapImageFeature } from "./tinkers";
import { useImageDragFeatureState } from "./useImageDragFeatureState";

interface Options extends Pick<WebRouteStoryProps, "images$" | "state$"> {
    map: maplibregl.Map;
    sourceDataGeojson: ImageMarkerSource;
    loadedImages: ReturnType<typeof useLoadedWebImages>;
    geojson: GeoJson | undefined;
    routeGeometryData: RouteGeometryData | null;
}

export const useMapImageInteraction = ({
    map,
    sourceDataGeojson,
    loadedImages,
    geojson,
    routeGeometryData,
    images$,
    state$,
}: Options): MapDataHandlers => {
    const [draggingImage] = useSubjectState(draggingImage$);
    const dragStartPoint = useRef<{ x: number; y: number } | null>(null);
    const dragAnchorOffset = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);

    const handlers = useMemo<MapDataHandlers>(
        () => ({
            options: {
                buffer: 0,
                isHoverEnabled: () =>
                    state$.value.markerLayerVisibility &&
                    draggingImage$.value?.interaction !== "map",
            },
            onMouseDown: ({ features, isTopRelated }, event) => {
                const feature = findMapImageFeature(features, event.point, (coordinate) => map.project(coordinate));
                didDrag.current = false;
                map.getCanvas().style.cursor = "grabbing";
                if (
                    !state$.value.markerLayerVisibility ||
                    !isTopRelated ||
                    !feature
                ) {
                    return;
                }
                dragStartPoint.current = event.point;
                const original = sourceDataGeojson.features.find(({ properties }) => properties.imageId === feature.properties.imageId);
                if (original) {
                    const point = map.project([
                        original.geometry.coordinates[0],
                        original.geometry.coordinates[1],
                    ]);
                    dragAnchorOffset.current = {
                        x: point.x - event.point.x,
                        y: point.y - event.point.y,
                    };
                }
                map.dragPan.disable();
                draggingImage$.next({
                    id: feature.properties.imageId,
                    interaction: "map",
                });
            },
            onMouseMove: ({ features, isTopRelated }) => {
                if (
                    !isTopRelated ||
                    (draggingImage$.value !== null &&
                        draggingImage$.value.interaction === "map")
                ) {
                    if (draggingImage$.value === null) {
                        map.getCanvas().style.cursor = "grab";
                    }
                    if (highlightIdsBySourceId$.value.size > 0) {
                        highlightIdsBySourceId$.next(new Map());
                    }
                    return;
                }
                map.getCanvas().style.cursor = "pointer";
                const ids = new Set(
                    features
                        .filter(({ properties }) => properties.imageId !== DRAGGED_IMAGE_ID)
                        .map((feature) => String(feature.properties.imageId)),
                );
                const previous = highlightIdsBySourceId$.value.get(imageSourceIds.thumbnails);
                if (
                    previous?.size === ids.size &&
                    [...ids].every((id) => previous.has(id))
                ) {
                    return;
                }
                highlightIdsBySourceId$.next(new Map([[imageSourceIds.thumbnails, ids]]));
            },
            onMouseUp: () => {
                map.getCanvas().style.cursor = "grab";
                if (draggingImage$.value?.interaction === "map") {
                    draggingImage$.next(null);
                }
                map.dragPan.enable();
            },
            onClick: ({ features, isTopRelated }, event) => {
                const feature = findMapImageFeature(features, event.point, (coordinate) => map.project(coordinate));
                if (didDrag.current) {
                    return;
                }
                if (!isTopRelated || !feature) {
                    clearImageMarkerSelection();
                    return;
                }
                const imageId = Number(feature.properties.imageId);
                selectMapImageMarker(
                    imageId,
                    Number(feature.properties.markerGroupSize ?? 1),
                    Number(feature.properties.markerGroupId ?? imageId),
                );
            },
        }),
        [map, sourceDataGeojson, state$],
    );

    useImageDragFeatureState(map);

    useEffect(() => {
        if (draggingImage === null || draggingImage.interaction !== "map") {
            return;
        }
        const getDragCoordinate = (event: {
            lngLat: maplibregl.LngLat;
            point?: { x: number; y: number };
        }) =>
            event.point
                ? map.unproject([
                      event.point.x + dragAnchorOffset.current.x,
                      event.point.y + dragAnchorOffset.current.y,
                  ])
                : event.lngLat;
        const handleDrag = (event: {
            lngLat: maplibregl.LngLat;
            point?: { x: number; y: number };
            preventDefault?: () => void;
        }) => {
            if (!geojson) {
                return;
            }
            if (event.point && dragStartPoint.current) {
                if (
                    Math.hypot(event.point.x - dragStartPoint.current.x, event.point.y - dragStartPoint.current.y) < 4 &&
                    !didDrag.current
                ) {
                    return;
                }
                didDrag.current = true;
            }
            event.preventDefault?.();
            draggingPlacement$.next(getRoutePlacement(getDragCoordinate(event), geojson, routeGeometryData));
        };
        const handleDragEnd = (
            event: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent,
        ) => {
            if (didDrag.current) {
                clearImageMarkerSelection();
            }
            if (!geojson || !didDrag.current) {
                draggingPlacement$.next(null);
                return;
            }
            event.preventDefault();
            const placement = getRoutePlacement(getDragCoordinate(event), geojson, routeGeometryData);
            const image = loadedImages.find((image) => image.id === draggingImage.id);
            draggingPlacement$.next(null);
            if (!image || !placement) {
                return;
            }
            updateImageDistanceFraction(images$, image.id, placement.distanceFraction);
        };
        map.dragPan.disable();
        map.on("mousemove", handleDrag);
        map.on("mouseup", handleDragEnd);
        map.on("touchmove", handleDrag);
        map.on("touchend", handleDragEnd);
        return () => {
            draggingPlacement$.next(null);
            map.dragPan.enable();
            map.off("mousemove", handleDrag);
            map.off("mouseup", handleDragEnd);
            map.off("touchmove", handleDrag);
            map.off("touchend", handleDragEnd);
        };
    }, [map, draggingImage, loadedImages, geojson, routeGeometryData, images$]);

    return handlers;
};
