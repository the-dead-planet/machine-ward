import { FC, useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { OverlayComponentProps, FeatureStateProps } from "@apparatus";
import { useSubjectState } from "@tinker-chest";
import { MapLayerData, MapSourceAndLayers } from "@web-apparatus";
import { useReducedMotion } from "@web-ui";
import { resolveMapImageMarkerColors, useTheme } from "@ui";
import { useLoadedWebImages } from "../hooks/useLoadedWebImages";
import { useImageInDisplay } from "./useImageInDisplay";
import { MapImageData, useRouteLayerImages } from "../hooks";
import {
    getIconImageId,
    getImageSource,
    getRoutePlacement,
    imageSourceIds,
    layerOrder,
    draggingImage$,
    draggingPlacement$,
    updateImageDistanceFraction,
    highlightIdsBySourceId$,
    imageLayerIds,
    useImageMarkerConnections,
    selectedImageId$,
    ImagesLayers,
    DRAGGED_IMAGE_ID,
    selectMapImageMarker,
    clearImageMarkerSelection,
    getImageCountBadges,
    IMAGE_COUNT_BADGE_SIZE,
    IMAGE_COUNT_BADGE_PIXEL_RATIO,
    getImageSourceWithMarkerVisibility,
    getImageSourceWithAnchors,
    getImageMarkerAnchorId,
    getImageMarkerFeatureId,
    IMAGE_MARKER_ANCHOR_ID,
    IMAGE_MARKER_ANCHOR_SDF_URI,
    IMAGE_MARKER_OUTLINE_ID,
    IMAGE_MARKER_OUTLINE_SDF_URI,
    IMAGE_MARKER_OUTLINE_SIZE,
    useAnimatedImageMarkerSource,
    getOutlinedThumbnailId,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { useImageMarkerSource } from "./useImageMarkerSource";
import { getImagesLayers } from "./images-layers";
import { ImageDragPreview } from "./ImageDragPreview";
import { WebRouteStoryProps } from "../model";
import { ImageGroupPager } from "./ImageGroupPager";
import { findMapImageFeature } from "./findMapImageFeature";
import { getOutlinedThumbnail } from "./outlined-thumbnail";

export const ImagesLayer: FC<
    OverlayComponentProps<maplibregl.Map> & WebRouteStoryProps
> = ({
    map,
    gearId,
    animatrix,
    data$,
    state$,
    routeGeometryData$,
    images$,
    playerOperator,
}) => {
    const theme = useTheme();
    const { defaultColor: imageColor, hoverColor: imageHoverColor, activeColor: imageActiveColor } = resolveMapImageMarkerColors(theme);
    const badgeTextColor = theme.resolveAppearance("fill", "tertiary").glyphs;
    const [displayImageId] = useSubjectState(animatrix.displayImageId$);
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [images] = useSubjectState(images$);
    const [{ markerLayerVisibility }] = useSubjectState(state$);
    const loadedImages = useLoadedWebImages(images);
    const [highlightIdsBySourceId, setHighlightIdsBySourceId] = useSubjectState(
        highlightIdsBySourceId$,
    );
    const [draggingImage, setDraggingImage] = useSubjectState(draggingImage$);
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const markerHighlightIds = useMemo(() => {
        const highlights = new Map(highlightIdsBySourceId);
        const imageIds = highlights.get(imageSourceIds.thumbnails);
        if (imageIds) {
            highlights.set(imageSourceIds.connections, imageIds);
            highlights.set(imageSourceIds.thumbnails, new Set([...imageIds].flatMap((id) => [
                String(getImageMarkerFeatureId(id)),
                String(getImageMarkerAnchorId(id)),
            ])));
        }
        return highlights;
    }, [highlightIdsBySourceId]);
    const dragStartPoint = useRef<{ x: number; y: number } | null>(null);
    const dragAnchorOffset = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);

    const mapImages = useMemo(
        (): MapImageData[] => [
            {
                iconImageName: IMAGE_MARKER_OUTLINE_ID,
                data: {
                    data: IMAGE_MARKER_OUTLINE_SDF_URI,
                    width: IMAGE_MARKER_OUTLINE_SIZE,
                    height: IMAGE_MARKER_OUTLINE_SIZE,
                },
                metadata: { sdf: true },
            },
            {
                iconImageName: IMAGE_MARKER_ANCHOR_ID,
                data: { data: IMAGE_MARKER_ANCHOR_SDF_URI, width: 64, height: 64 },
                metadata: { sdf: true, pixelRatio: 4 },
            },
            ...loadedImages.flatMap((image): MapImageData[] => [
                {
                    iconImageName: getIconImageId(image),
                    data: image.data.bitmap!,
                },
                {
                    iconImageName: getIconImageId(image, { thumbnail: true }),
                    data: image.data.thumbnailBitmap!,
                },
            ]),
        ],
        [loadedImages],
    );
    useRouteLayerImages(map, mapImages);
    const outlinedImages = useMemo(
        (): MapImageData[] =>
            loadedImages.flatMap((image) =>
                [...new Set([imageColor, imageHoverColor])].map((color) => ({
                    iconImageName: getOutlinedThumbnailId(
                        getIconImageId(image, { thumbnail: true }),
                        color,
                    ),
                    data: getOutlinedThumbnail(
                        image.data.thumbnailBitmap!,
                        color,
                    ),
                })),
            ),
        [loadedImages, imageColor, imageHoverColor],
    );
    useRouteLayerImages(map, outlinedImages);
    const badgeImages = useMemo((): MapImageData[] =>
        getImageCountBadges(imageColor, badgeTextColor).map(({ id, svg }) => ({
            iconImageName: id,
            data: {
                data: `data:image/svg+xml,${encodeURIComponent(svg)}`,
                width: IMAGE_COUNT_BADGE_SIZE,
                height: IMAGE_COUNT_BADGE_SIZE,
            },
            metadata: {
                pixelRatio: IMAGE_COUNT_BADGE_PIXEL_RATIO,
            },
        })), [imageColor, badgeTextColor]);
    useRouteLayerImages(map, badgeImages);

    const sourceDataGeojson = useMemo(
        () => getImageSource(loadedImages, geojson, routeGeometryData),
        [loadedImages, geojson, routeGeometryData],
    );
    const targetSource = useImageMarkerSource(
        map,
        sourceDataGeojson,
        displayImageId !== null,
    );
    const reducedMotion = useReducedMotion();
    const groupedSource = useAnimatedImageMarkerSource(targetSource, reducedMotion);
    const visibleSource = useMemo(() => getImageSourceWithMarkerVisibility(groupedSource, markerLayerVisibility), [groupedSource, markerLayerVisibility]);
    const connections = useImageMarkerConnections(sourceDataGeojson, visibleSource);
    const connectionsUpdate = useMemo(() => ({
        sourceId: imageSourceIds.connections,
        data: connections,
    }), [connections]);
    const [connectionsLayerData] = useState<MapLayerData>(
        () => ({
            sourceId: imageSourceIds.connections,
            source: {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            },
            layers: [
                {
                    id: imageLayerIds.connections,
                    type: "line",
                    source: imageSourceIds.connections,
                    paint: ImagesLayers.connections.getPaint(imageColor, imageHoverColor, imageActiveColor, null),
                },
            ],
        }),
    );
    useEffect(() => {
        if (map.getLayer(imageLayerIds.connections)) {
            const paint = ImagesLayers.connections.getPaint(imageColor, imageHoverColor, imageActiveColor, selectedImageId);
            map.setPaintProperty(imageLayerIds.connections, "line-color", paint["line-color"]);
        }
    }, [map, imageColor, imageHoverColor, imageActiveColor, selectedImageId]);

    const mapLayerData = useMemo(
        (): MapLayerData => ({
            sourceId: imageSourceIds.thumbnails,
            source: {
                type: "geojson",
                data: getImageSourceWithAnchors(sourceDataGeojson, sourceDataGeojson),
            },
            layers: getImagesLayers(
                displayImageId,
                imageColor,
                imageHoverColor,
                imageActiveColor,
                badgeTextColor,
            ),
            handlers: {
                options: {
                    buffer: 0,
                    isHoverEnabled: () =>
                        state$.value.markerLayerVisibility && draggingImage$.value?.interaction !== "map", // prevent lag when dragging
                },
                onMouseDown: ({ features, isTopRelated }, event) => {
                    const feature = findMapImageFeature(features, event.point, (coordinate) => map.project(coordinate));
                    didDrag.current = false;
                    map.getCanvas().style.cursor = "grabbing";
                    if (!state$.value.markerLayerVisibility || !isTopRelated || !feature) {
                        return;
                    }
                    dragStartPoint.current = event.point;
                    const original = sourceDataGeojson.features.find(({ properties }) => properties.imageId === feature.properties.imageId);
                    if (original) {
                        const point = map.project([original.geometry.coordinates[0], original.geometry.coordinates[1]]);
                        dragAnchorOffset.current = { x: point.x - event.point.x, y: point.y - event.point.y };
                    }
                    map.dragPan.disable();
                    setDraggingImage({
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
                            setHighlightIdsBySourceId(new Map());
                        }

                        return;
                    }

                    map.getCanvas().style.cursor = "pointer";
                    const ids = new Set(
                        features
                            .filter(
                                ({ properties }) =>
                                    properties.imageId !== DRAGGED_IMAGE_ID,
                            )
                            .map((feature) => String(feature.properties.imageId)),
                    );
                    const previous = highlightIdsBySourceId$.value.get(
                        imageSourceIds.thumbnails,
                    );
                    if (
                        previous?.size === ids.size &&
                        [...ids].every((id) => previous.has(id))
                    ) {
                        return;
                    }
                    setHighlightIdsBySourceId(
                        new Map([[imageSourceIds.thumbnails, ids]]),
                    );
                },
                onMouseUp: () => {
                    map.getCanvas().style.cursor = "grab";
                    if (draggingImage$.value?.interaction === "map") {
                        setDraggingImage(null);
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
            },
        }),
        [sourceDataGeojson, imageColor, imageHoverColor, imageActiveColor, badgeTextColor],
    );

    useEffect(() => {
        if (draggingImage === null) {
            return;
        }
        const update = (value: boolean) => {
            if (map.getSource(imageSourceIds.thumbnails)) {
                for (const id of [getImageMarkerFeatureId(draggingImage.id), getImageMarkerAnchorId(draggingImage.id)]) {
                    map.setFeatureState(
                        { source: imageSourceIds.thumbnails, id },
                        { [FeatureStateProps.Dragging]: value },
                    );
                }
            }
        };
        update(true);

        return () => {
            update(false);
        };
    }, [draggingImage]);

    useEffect(() => {
        if (draggingImage === null || draggingImage.interaction !== "map") {
            return;
        }

        const getDragCoordinate = (event: { lngLat: maplibregl.LngLat; point?: { x: number; y: number } }) =>
            event.point ? map.unproject([
                event.point.x + dragAnchorOffset.current.x,
                event.point.y + dragAnchorOffset.current.y,
            ]) : event.lngLat;

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
                    Math.hypot(
                        event.point.x - dragStartPoint.current.x,
                        event.point.y - dragStartPoint.current.y,
                    ) < 4 &&
                    !didDrag.current
                ) {
                    return;
                }
                didDrag.current = true;
            }
            event.preventDefault?.();
            draggingPlacement$.next(
                getRoutePlacement(getDragCoordinate(event), geojson, routeGeometryData),
            );
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
            const placement = getRoutePlacement(
                getDragCoordinate(event),
                geojson,
                routeGeometryData,
            );
            const image = loadedImages.find(
                (image) => image.id === draggingImage.id,
            );
            draggingPlacement$.next(null);
            if (!image || !placement) {
                return;
            }
            updateImageDistanceFraction(
                images$,
                image.id,
                placement.distanceFraction,
            );
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
    }, [draggingImage, loadedImages, geojson, routeGeometryData]);

    const updatedData = useMemo(() => {
        const source = getImageSourceWithAnchors(
            sourceDataGeojson,
            visibleSource,
        );
        const highlighted = highlightIdsBySourceId.get(
            imageSourceIds.thumbnails,
        );
        return {
            sourceId: imageSourceIds.thumbnails,
            data: {
                ...source,
                features: source.features.map((feature) => ({
                    ...feature,
                    properties: {
                        ...feature.properties,
                        [FeatureStateProps.Highlight]:
                            feature.properties.markerSelected ||
                            highlighted?.has(
                                String(feature.properties.imageId),
                            ) ||
                            false,
                    },
                })),
            },
        };
    }, [sourceDataGeojson, visibleSource, highlightIdsBySourceId]);

    useImageInDisplay(map, animatrix, playerOperator);

    return (
        <>
            <MapSourceAndLayers
                map={map}
                mapLayerData={connectionsLayerData}
                layerOrder={layerOrder}
                updatedData={connectionsUpdate}
            />
            <MapSourceAndLayers
                map={map}
                mapLayerData={mapLayerData}
                highlightIdsBySourceId={markerHighlightIds}
                layerOrder={layerOrder}
                updatedData={updatedData}
            />
            <ImageDragPreview map={map} source={groupedSource} visible={markerLayerVisibility} />
            {markerLayerVisibility && groupedSource.pagination && (
                <ImageGroupPager
                    map={map}
                    pagination={groupedSource.pagination}
                    gearId={gearId}
                />
            )}
        </>
    );
};
