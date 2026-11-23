import type * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

export interface ImageParams {
    data: string;
    width: number;
    height: number;
}

export interface MapImageData {
    iconImageName: string;
    data: ImageBitmap | ImageParams;
    metadata?: Partial<maplibregl.StyleImageMetadata>;
}

export const useRouteLayerImages = (
    map: maplibregl.Map,
    data: MapImageData[],
) => {
    const registeredImages = useRef(new Map<string, { image: MapImageData; abortController: AbortController; loaded: boolean }>());

    useEffect(() => {
        const images = registeredImages.current;
        return () => {
            for (const [iconImageName, { abortController }] of images) {
                abortController.abort();
                if (map.hasImage(iconImageName)) {
                    map.removeImage(iconImageName);
                }
            }
            images.clear();
        };
    }, [map]);

    useEffect(() => {
        const images = registeredImages.current;
        const nextNames = new Set(data.map(({ iconImageName }) => iconImageName));
        for (const [iconImageName, { abortController }] of images) {
            if (!nextNames.has(iconImageName)) {
                abortController.abort();
                if (map.hasImage(iconImageName)) {
                    map.removeImage(iconImageName);
                }
                images.delete(iconImageName);
            }
        }

        for (const imageData of data) {
            const { data, iconImageName, metadata } = imageData;
            const previous = images.get(iconImageName);
            const previousData = previous?.image.data;
            const unchanged = previousData === data || (previousData && "data" in previousData && "data" in data && previousData.data === data.data && previousData.width === data.width && previousData.height === data.height);
            if (unchanged && JSON.stringify(previous?.image.metadata) === JSON.stringify(metadata) && previous && (!previous.loaded || map.hasImage(iconImageName))) {
                continue;
            }

            previous?.abortController.abort();
            const abortController = new AbortController();
            const registeredImage = { image: imageData, abortController, loaded: false };
            images.set(iconImageName, registeredImage);
            if (map.hasImage(iconImageName)) {
                map.removeImage(iconImageName);
            }

            if ("data" in data) {
                const image = new Image(data.width, data.height);

                image.onload = () => {
                    if (abortController.signal.aborted) {
                        return;
                    }
                    if (map.hasImage(iconImageName)) {
                        map.removeImage(iconImageName);
                    }
                    map.addImage(iconImageName, image, metadata);
                    registeredImage.loaded = true;
                };

                image.src = data.data;
            } else {
                const bitmap = data;
                map.addImage(iconImageName, bitmap, metadata);
                registeredImage.loaded = true;
            }
        }

    }, [map, data]);

    return null;
};
