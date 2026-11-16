import { useMemo, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
    getIconImageId,
    getImageCountBadges,
    getOutlinedThumbnailId,
    IMAGE_COUNT_BADGE_PIXEL_RATIO,
    IMAGE_COUNT_BADGE_SIZE,
    IMAGE_MARKER_ANCHOR_ID,
    IMAGE_MARKER_ANCHOR_SDF_URI,
    IMAGE_MARKER_OUTLINE_ID,
    IMAGE_MARKER_OUTLINE_SDF_URI,
    IMAGE_MARKER_OUTLINE_SIZE,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { MapImageData, useRouteLayerImages } from "../hooks";
import { useLoadedWebImages } from "../hooks/useLoadedWebImages";
import { getOutlinedThumbnail } from "./outlined-thumbnail";

export const useImageLayerAssets = (
    map: MapLibreMap,
    loadedImages: ReturnType<typeof useLoadedWebImages>,
    imageColor: string,
    imageHoverColor: string,
    badgeTextColor: string,
) => {
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
                data: {
                    data: IMAGE_MARKER_ANCHOR_SDF_URI,
                    width: 64,
                    height: 64,
                },
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

    const outlinedCache = useRef(new Map<string, { thumbnail: ImageBitmap; data: ImageBitmap }>());
    const outlinedImages = useMemo((): MapImageData[] => {
        const nextCache = new Map<string, { thumbnail: ImageBitmap; data: ImageBitmap }>();
        const images = loadedImages.flatMap((image) =>
            [...new Set([imageColor, imageHoverColor])].map((color) => {
                const iconImageName = getOutlinedThumbnailId(getIconImageId(image, { thumbnail: true }), color);
                const thumbnail = image.data.thumbnailBitmap!;
                const cached = outlinedCache.current.get(iconImageName);
                const data = cached?.thumbnail === thumbnail ? cached.data : getOutlinedThumbnail(thumbnail, color);
                nextCache.set(iconImageName, { thumbnail, data });
                return { iconImageName, data };
            }),
        );
        outlinedCache.current = nextCache;
        return images;
    }, [loadedImages, imageColor, imageHoverColor]);
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
