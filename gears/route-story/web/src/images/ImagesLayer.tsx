import { FC, useMemo } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { OverlayComponentProps, FeatureStateProps } from "@apparatus";
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
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
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
    const [{ markerLayerVisibility }] = useSubjectState(state$);
    const loadedImages = useLoadedWebImages(images);
    const [highlightIdsBySourceId] = useSubjectState(highlightIdsBySourceId$);

    useImageLayerAssets(
        map,
        loadedImages,
        imageColor,
        imageHoverColor,
        badgeTextColor,
    );
    const sourceDataGeojson = useMemo(
        () => getImageSource(loadedImages, geojson, routeGeometryData),
        [loadedImages, geojson, routeGeometryData],
    );
    const targetSource = useImageMarkerSource(map, sourceDataGeojson, displayImageId !== null);
    const reducedMotion = useReducedMotion();
    const groupedSource = useAnimatedImageMarkerSource(targetSource, reducedMotion);
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
        );
    const handlers = useMapImageInteraction({
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
                data: getImageSourceWithAnchors(sourceDataGeojson, sourceDataGeojson),
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
            sourceDataGeojson,
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
        const source = getImageSourceWithAnchors(sourceDataGeojson, visibleSource);
        const highlighted = highlightIdsBySourceId.get(imageSourceIds.thumbnails);
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
                            highlighted?.has(String(feature.properties.imageId)) ||
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
            <ImageDragPreview
                map={map}
                source={groupedSource}
                visible={markerLayerVisibility}
            />
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
