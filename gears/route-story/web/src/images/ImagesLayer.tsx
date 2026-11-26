import { FC, useMemo } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { OverlayComponentProps } from "@apparatus";
import { useSubjectState } from "@tinker-chest";
import { MapLayerData, MapSourceAndLayers } from "@web-apparatus";
import { useReducedMotion } from "@web-ui";
import { resolveMapImageMarkerColors, useTheme } from "@ui";
import {
    getImageSource,
    imageSourceIds,
    layerOrder,
    highlightIdsBySourceId$,
    useImageMarkerConnections,
    getImageSourceWithMarkerVisibility,
    getImageSourceWithAnchors,
    getImageMarkerAnchorId,
    getImageMarkerFeatureId,
    useAnimatedImageMarkerSource,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useLoadedWebImages } from "../hooks/useLoadedWebImages";
import { WebRouteStoryProps } from "../model";
import { useImageInDisplay } from "./useImageInDisplay";
import { useImageMarkerSource } from "./useImageMarkerSource";
import { getImagesLayers } from "./images-layers";
import { ImageDragPreview } from "./ImageDragPreview";
import { ImageGroupPager } from "./ImageGroupPager";
import { useImageLayerAssets } from "./useImageLayerAssets";
import { useImageConnectionsLayer } from "./useImageConnectionsLayer";
import { useMapImageInteraction } from "./useMapImageInteraction";

export const ImagesLayer: FC<OverlayComponentProps<MapLibreMap> & WebRouteStoryProps> = ({
    map,
    gearId,
    animatrix,
    data$,
    state$,
    routeGeometryData$,
    images$,
    playerOperator,
    imageMarkerOperator,
}) => {
    const theme = useTheme();
    const {
        defaultColor: imageColor,
        hoverColor: imageHoverColor,
        activeColor: imageActiveColor,
    } = resolveMapImageMarkerColors(theme);
    const badgeTextColor = theme.resolveAppearance("fill", "tertiary").glyphs;
    const [displayImageId] = useSubjectState(animatrix.displayImageId$);
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [images] = useSubjectState(images$);
    const [{ markerLayerVisibility, imageMarkerStyle }] = useSubjectState(state$);
    const loadedImages = useLoadedWebImages(images);
    const [highlightIdsBySourceId] = useSubjectState(highlightIdsBySourceId$);
    const [selectedImageId] = useSubjectState(imageMarkerOperator.selectedImageId$);

    useImageLayerAssets(
        map,
        loadedImages,
        imageColor,
        imageHoverColor,
        badgeTextColor,
        imageMarkerStyle.shape,
    );

    const sourceDataGeojson = useMemo(
        () => getImageSource(loadedImages, geojson, routeGeometryData, imageMarkerStyle),
        [loadedImages, geojson, routeGeometryData, imageMarkerStyle],
    );
    const targetSource = useImageMarkerSource(map, sourceDataGeojson, displayImageId !== null, imageMarkerOperator);
    const reducedMotion = useReducedMotion();
    // Drag release clears selection; keyboard moves keep it.
    const groupedSource = useAnimatedImageMarkerSource(targetSource, reducedMotion, selectedImageId !== null);
    const visibleSource = useMemo(
        () => getImageSourceWithMarkerVisibility(groupedSource, markerLayerVisibility),
        [groupedSource, markerLayerVisibility],
    );
    const connections = useImageMarkerConnections(sourceDataGeojson, visibleSource);
    const { layerData: connectionsLayerData, updatedData: connectionsUpdate } =
        useImageConnectionsLayer(
            map,
            connections,
            imageColor,
            imageHoverColor,
            imageActiveColor,
            imageMarkerOperator,
        );
    const handlers = useMapImageInteraction({
        imageMarkerOperator,
        map,
        sourceDataGeojson,
        loadedImages,
        geojson,
        routeGeometryData,
        images$,
        state$,
    });
    const mapLayerData = useMemo(
        (): MapLayerData => ({
            sourceId: imageSourceIds.thumbnails,
            source: {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: [],
                },
            },
            layers: getImagesLayers(
                displayImageId,
                imageColor,
                imageHoverColor,
                imageActiveColor,
                badgeTextColor,
            ),
            handlers,
        }),
        [
            imageColor,
            imageHoverColor,
            imageActiveColor,
            badgeTextColor,
            handlers,
        ],
    );

    const markerHighlightIds = useMemo(() => {
        const highlights = new Map(highlightIdsBySourceId);
        const imageIds = highlights.get(imageSourceIds.thumbnails);
        if (imageIds) {
            highlights.set(imageSourceIds.connections, imageIds);
            highlights.set(
                imageSourceIds.thumbnails,
                new Set(
                    [...imageIds].flatMap((id) => [
                        String(getImageMarkerFeatureId(id)),
                        String(getImageMarkerAnchorId(id)),
                    ]),
                ),
            );
        }
        return highlights;
    }, [highlightIdsBySourceId]);

    const updatedData = useMemo(() => {
        const highlighted = highlightIdsBySourceId.get(imageSourceIds.thumbnails);
        return {
            sourceId: imageSourceIds.thumbnails,
            data: getImageSourceWithAnchors(sourceDataGeojson, visibleSource, highlighted),
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
            <ImageDragPreview
                map={map}
                source={groupedSource}
                visible={markerLayerVisibility}
            />
            {markerLayerVisibility && groupedSource.pagination && (
                <ImageGroupPager
                    imageMarkerOperator={imageMarkerOperator}
                    map={map}
                    pagination={groupedSource.pagination}
                    gearId={gearId}
                />
            )}
        </>
    );
};
