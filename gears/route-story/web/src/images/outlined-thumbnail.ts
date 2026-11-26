import { getImageMarkerShapePath, MAP_THUMBNAIL_BORDER_SIZE, MAP_THUMBNAIL_SIZE, OUTLINED_MAP_THUMBNAIL_SIZE, ImageMarkerShape } from "@the-dead-planet/machine-ward-gears-route-story-common";

export const getOutlinedThumbnail = (image: ImageBitmap, color?: string, shape: ImageMarkerShape = 'circle'): ImageBitmap => {
    const size = color ? OUTLINED_MAP_THUMBNAIL_SIZE : MAP_THUMBNAIL_SIZE;
    const inset = color ? MAP_THUMBNAIL_BORDER_SIZE : 0;
    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Cannot render map thumbnail outline");
    }
    if (color) {
        context.fillStyle = color;
        context.fill(new Path2D(getImageMarkerShapePath(shape, size)));
    }
    context.clip(new Path2D(getImageMarkerShapePath(shape, MAP_THUMBNAIL_SIZE, inset)));
    context.drawImage(
        image,
        inset,
        inset,
        MAP_THUMBNAIL_SIZE,
        MAP_THUMBNAIL_SIZE,
    );
    return canvas.transferToImageBitmap();
};
