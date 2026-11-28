import { LoadedImageData, MarkerImage } from "@apparatus";
import { useMemo } from "react";
import { WebMarkerImageData } from "../images/image-parser";

export const isLoadedWebImage = (image: MarkerImage<WebMarkerImageData>): image is MarkerImage<WebMarkerImageData> & LoadedImageData<WebMarkerImageData> =>
    image.progress === 100 && !!image.data?.bitmap && !!image.data.thumbnailBitmap && !!image.data.data && image.distanceFraction !== undefined;

/**
 * @returns Filtered images with valid data and assignment to a feature id.
 */
export const useLoadedWebImages = (images: MarkerImage<WebMarkerImageData>[]): LoadedImageData<WebMarkerImageData>[] => {
    const loadedImages = useMemo(() => images.filter(isLoadedWebImage), [images]);

    return loadedImages;
};
