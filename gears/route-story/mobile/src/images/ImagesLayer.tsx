import { FC, useMemo, useRef } from "react";
import { Layer, Images, GeoJSONSource, ImageEntry } from "@maplibre/maplibre-react-native";
import { resolveMapImageMarkerColors, useTheme } from "@ui";
import { OverlayComponentProps } from "@apparatus";
import { useSubjectState } from "@tinker-chest";
import {
    getIconImageId,
    getImageSource,
    getImageSourceWithDraggingState,
    getImageSourceWithMarkerVisibility,
    getImageSourceWithAnchors,
    IMAGE_MARKER_ANCHOR_ID,
    IMAGE_MARKER_ANCHOR_SDF_URI,
    IMAGE_MARKER_OUTLINE_ID,
    IMAGE_MARKER_OUTLINE_SDF_URI,
    useImageMarkerConnections,
    selectedImageId$,
    ImagesLayers,
    routeLayerIds,
    imageLayerIds,
    imageSourceIds,
    draggingImage$,
    useAnimatedImageMarkerSource,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { MobileMap } from "@mobile-apparatus";
import { useReducedMotion } from "@mobile-ui";
import { useLoadedMobileImages } from "./useLoadedMobileImages";
import { useImageInDisplay } from "./useImageInDisplay";
import { useImageMarkerSource } from "./useImageMarkerSource";
import { useMapImageInteraction } from "./useMapImageInteraction";
import { ImageDragPreview } from "./ImageDragPreview";
import { MobileRouteStoryProps } from "../model";
import { CircularMapThumbnail } from "./CircularMapThumbnail";
import { ImageCountBadges } from './ImageCountBadges';
import { ImageGroupPager } from "./ImageGroupPager";
import { ImageGroupPagerDimensions } from "./model";

export const ImagesLayer: FC<OverlayComponentProps<MobileMap> & MobileRouteStoryProps> = ({
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
    const badgeAppearance = theme.resolveAppearance("fill", "tertiary");
    const [displayImageId] = useSubjectState(animatrix.displayImageId$);
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [images] = useSubjectState(images$);
    const [{ markerLayerVisibility }] = useSubjectState(state$);
    const [draggingImage] = useSubjectState(draggingImage$);
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const loadedImages = useLoadedMobileImages(images);
    const originalSource = useMemo(
        () => getImageSource(loadedImages, geojson, routeGeometryData),
        [loadedImages, geojson, routeGeometryData],
    );
    const { groupedSource: targetSource, hitTargets, paginationTarget } = useImageMarkerSource(map, originalSource, displayImageId !== null);
    const reducedMotion = useReducedMotion();
    const paginationDimensions = useRef<ImageGroupPagerDimensions | null>(null);
    const groupedSource = useAnimatedImageMarkerSource(targetSource, reducedMotion);
    const visibleSource = useMemo(() => getImageSourceWithMarkerVisibility(groupedSource, markerLayerVisibility), [groupedSource, markerLayerVisibility]);
    const connections = useImageMarkerConnections(originalSource, visibleSource);
    useMapImageInteraction(map, images$, geojson, routeGeometryData, markerLayerVisibility, hitTargets, paginationTarget, paginationDimensions, groupedSource === targetSource);
    const renderedSource = useMemo(
        () => getImageSourceWithDraggingState(getImageSourceWithAnchors(originalSource, visibleSource), draggingImage?.id ?? null),
        [originalSource, visibleSource, draggingImage],
    );

    const imageSources: Record<string, ImageEntry> = Object.fromEntries(
        loadedImages.flatMap((image) => {
            const fullSize: [string, ImageEntry] = [
                getIconImageId(image),
                { source: { uri: image.data.fullSize } },
            ];
            return displayImageId === image.id
                ? [fullSize]
                : [];
        }),
    );
    imageSources[IMAGE_MARKER_ANCHOR_ID] = {
        source: { uri: IMAGE_MARKER_ANCHOR_SDF_URI, scale: 4 },
        sdf: true,
    };
    imageSources[IMAGE_MARKER_OUTLINE_ID] = {
        source: { uri: IMAGE_MARKER_OUTLINE_SDF_URI },
        sdf: true,
    };
    const imageInDisplayIconSize = useImageInDisplay(map, animatrix, playerOperator);

    return (
        <>
            <Images images={imageSources} />
            <ImageCountBadges
                backgroundColor={imageColor}
                textColor={badgeAppearance.glyphs}
            />
            {loadedImages.map((image) => (
                <CircularMapThumbnail
                    key={`${image.id}:${image.data.thumbnail}`}
                    imageId={getIconImageId(image, { thumbnail: true })}
                    uri={image.data.thumbnail}
                    outlineColors={[imageColor, imageHoverColor]}
                />
            ))}
            <GeoJSONSource id={imageSourceIds.connections} data={connections}>
                <Layer
                    type="line"
                    id={imageLayerIds.connections}
                    afterId={routeLayerIds.currentPoint}
                    paint={ImagesLayers.connections.getPaint(
                        imageColor,
                        imageHoverColor,
                        imageActiveColor,
                        selectedImageId,
                    )}
                />
            </GeoJSONSource>
            <GeoJSONSource id={imageSourceIds.thumbnails} data={renderedSource}>
                <Layer
                    type="symbol"
                    id={imageLayerIds.anchors}
                    afterId={imageLayerIds.connections}
                    filter={ImagesLayers.anchorsUnselected.filter}
                    layout={ImagesLayers.anchors.layout}
                    paint={ImagesLayers.anchors.getPaint(imageColor, imageHoverColor, imageActiveColor)}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.thumbnailsStackBack}
                    afterId={imageLayerIds.anchors}
                    {...ImagesLayers.thumbnailsStackBack}
                    layout={ImagesLayers.thumbnailsStackBack.layout}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.thumbnailsStackFront}
                    afterId={imageLayerIds.thumbnailsStackBack}
                    {...ImagesLayers.thumbnailsStackFront}
                    layout={ImagesLayers.thumbnailsStackFront.layout}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.thumbnails}
                    afterId={imageLayerIds.thumbnailsStackFront}
                    filter={ImagesLayers.thumbnailsOutlined.filter}
                    layout={ImagesLayers.thumbnailsOutlined.getLayout(imageColor, imageHoverColor)}
                    paint={ImagesLayers.thumbnailsOutlined.paint}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.countBadge}
                    afterId={imageLayerIds.thumbnails}
                    filter={ImagesLayers.countBadge.filter}
                    paint={ImagesLayers.countBadge.paint}
                    layout={ImagesLayers.countBadge.getLayout(imageColor, badgeAppearance.glyphs)}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.anchorsSelected}
                    afterId={imageLayerIds.countBadge}
                    filter={ImagesLayers.anchorsSelected.filter}
                    layout={ImagesLayers.anchorsSelected.layout}
                    paint={ImagesLayers.anchorsSelected.getPaint(imageColor, imageHoverColor, imageActiveColor)}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.thumbnailsSelectedOutline}
                    afterId={imageLayerIds.anchorsSelected}
                    filter={ImagesLayers.thumbnailsSelectedOutline.filter}
                    layout={ImagesLayers.thumbnailsSelectedOutline.layout}
                    paint={ImagesLayers.thumbnailsSelectedOutline.getPaint(imageColor, imageHoverColor, imageActiveColor)}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.thumbnailsSelected}
                    afterId={imageLayerIds.thumbnailsSelectedOutline}
                    filter={ImagesLayers.thumbnailsSelected.filter}
                    layout={ImagesLayers.thumbnailsSelected.layout}
                    paint={ImagesLayers.thumbnailsSelected.paint}
                />
                <Layer
                    type="symbol"
                    id={imageLayerIds.imageInDisplay}
                    afterId={imageLayerIds.thumbnailsHighlight}
                    filter={ImagesLayers.imageInDisplay.getFilter(displayImageId)}
                    layout={{
                        ...ImagesLayers.imageInDisplay.layout,
                        "icon-size": imageInDisplayIconSize,
                    }}
                />
            </GeoJSONSource>
            <ImageDragPreview
                source={groupedSource}
                visible={markerLayerVisibility}
            />
            {markerLayerVisibility && groupedSource.pagination && (
                <ImageGroupPager
                    pagination={groupedSource.pagination}
                    gearId={gearId}
                    dimensions={paginationDimensions}
                />
            )}
        </>
    );
};
