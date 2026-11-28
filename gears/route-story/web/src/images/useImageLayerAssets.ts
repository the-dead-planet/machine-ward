import { useMemo, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
    getIconImageId,
    getImageMarkerThumbnailId,
    getImageMarkerOutlineId,
    getImageCountBadges,
    getOutlinedThumbnailId,
    IMAGE_COUNT_BADGE_PIXEL_RATIO,
    IMAGE_COUNT_BADGE_SIZE,
    IMAGE_MARKER_ANCHOR_ID,
    IMAGE_MARKER_ANCHOR_SDF_URI,
    IMAGE_MARKER_OUTLINE_SDF_URIS,
    IMAGE_MARKER_OUTLINE_SIZE,
    ImageMarkerShape,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { MapImageData, useRouteLayerImages } from "../hooks";
import { useLoadedWebImages } from "../hooks/useLoadedWebImages";
import { getOutlinedThumbnail } from "./outlined-thumbnail";

export const useImageLayerAssets = (
    map: MapLibreMap,
    loadedImages: ReturnType<typeof useLoadedWebImages>,
    imageColor: string,
    imageHoverColor: string,
    badgeTextColor: string,
    shape: ImageMarkerShape = 'circle',
) => {
    const mapImages = useMemo(
        (): MapImageData[] => [
            ...Object.entries(IMAGE_MARKER_OUTLINE_SDF_URIS).map(([outlineShape, uri]): MapImageData => ({
                iconImageName: getImageMarkerOutlineId(outlineShape),
                data: {
                    data: uri,
                    width: IMAGE_MARKER_OUTLINE_SIZE,
                    height: IMAGE_MARKER_OUTLINE_SIZE,
                },
                metadata: { sdf: true },
            })),
            {
                iconImageName: IMAGE_MARKER_ANCHOR_ID,
                data: {
                    data: IMAGE_MARKER_ANCHOR_SDF_URI,
                    width: 64,
                    height: 64,
                },
                metadata: { sdf: true, pixelRatio: 4 },
            },
            ...loadedImages.map((image): MapImageData => ({
                iconImageName: getIconImageId(image),
                data: image.data.bitmap!,
            })),
        ],
        [loadedImages],
    );
    useRouteLayerImages(map, mapImages);

    const outlinedCache = useRef(new Map<string, { thumbnail: ImageBitmap; data: ImageBitmap }>());
    const outlinedImages = useMemo((): MapImageData[] => {
        const nextCache = new Map<string, { thumbnail: ImageBitmap; data: ImageBitmap }>();
        const images = loadedImages.flatMap((image) =>
            [undefined, ...new Set([imageColor, imageHoverColor])].map((color) => {
                const imageId = getImageMarkerThumbnailId(image, shape);
                const iconImageName = color ? getOutlinedThumbnailId(imageId, color) : imageId;
                const thumbnail = image.data.thumbnailBitmap!;
                const cached = outlinedCache.current.get(iconImageName);
                const data = cached?.thumbnail === thumbnail ? cached.data : getOutlinedThumbnail(thumbnail, color, shape);
                nextCache.set(iconImageName, { thumbnail, data });
                return { iconImageName, data };
            }),
        );
        outlinedCache.current = nextCache;
        return images;
    }, [loadedImages, imageColor, imageHoverColor, shape]);
    useRouteLayerImages(map, outlinedImages);

    const badgeImages = useMemo(
        (): MapImageData[] =>
            getImageCountBadges(imageColor, badgeTextColor).map(
                ({ id, svg }) => ({
                    iconImageName: id,
                    data: {
                        data: `data:image/svg+xml,${encodeURIComponent(svg)}`,
                        width: IMAGE_COUNT_BADGE_SIZE,
                        height: IMAGE_COUNT_BADGE_SIZE,
                    },
                    metadata: { pixelRatio: IMAGE_COUNT_BADGE_PIXEL_RATIO },
                }),
            ),
        [imageColor, badgeTextColor],
    );
    useRouteLayerImages(map, badgeImages);
};
