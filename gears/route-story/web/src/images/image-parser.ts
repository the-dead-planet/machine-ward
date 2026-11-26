import EXIF from 'exif-js';
import { ExifData, glitchmitter } from '@apparatus';
import { FULL_SIZE_IMAGE_SIZE, MAP_THUMBNAIL_SIZE   } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { getExifError, getExifLngLat, LngLat } from "@tinker-chest";
import { getResizeDimensions } from "@the-dead-planet/machine-ward-gears-route-story-common/src/file-parser";

export interface WebMarkerImageData {
    data?: string;
    bitmap?: ImageBitmap;
    thumbnailBitmap?: ImageBitmap;
}

export const parseImage = async (
    e: ProgressEvent<FileReader>,
    file: File,
): Promise<{
    data?: string;
    bitmap?: ImageBitmap;
    thumbnailBitmap?: ImageBitmap;
    exif?: ExifData;
    error?: string;
    lngLat?: LngLat;
}> => {
    const buffer = await file.arrayBuffer();
    const exif = EXIF.readFromBinaryFile(buffer) as false | ExifData;

    let bitmap: ImageBitmap | undefined;
    let thumbnailBitmap: ImageBitmap | undefined;
    try {
        [bitmap, thumbnailBitmap] = await Promise.all([
            resizeImage(e.target?.result, { targetSize: FULL_SIZE_IMAGE_SIZE }),
            resizeImage(e.target?.result, { targetSize: MAP_THUMBNAIL_SIZE, squareCrop: true }),
        ]);
    } catch (err) {
        glitchmitter.transmit('Error resizing image', err);
    }

    // TODO: Derive timezone
    return {
        data: e.target?.result?.toString(),
        bitmap,
        thumbnailBitmap,
        exif: exif || undefined,
        lngLat: getExifLngLat(exif || undefined),
        error: getExifError(exif),
    };
};

interface ResizeImageOptions {
    targetSize?: number;
    squareCrop?: boolean;
}

/**
 * @param e File progress event
 * @param size Defaults to 200px
 * @returns Resized image
 */
const resizeImage = (
    result?: FileReader['result'],
    options: ResizeImageOptions = {}
): Promise<ImageBitmap> => {
    const { targetSize = 200, squareCrop = false } = options;

    return new Promise((resolve, reject) => {
        if (!result) {
            reject();
            return;
        }

        const img = new Image();

        img.onload = () => {
            const {
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                targetWidth,
                targetHeight,
            } = getResizeDimensions(img, targetSize, { keepAspectRatio: squareCrop });

            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d")!;

            ctx.drawImage(
                img,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                targetWidth,
                targetHeight
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject();
                    return;
                }
                createImageBitmap(blob).then(resolve);
            }, "image/png");
        };

        img.src = result.toString();
    });
};
