import {
    MAP_THUMBNAIL_BORDER_SIZE,
    MAP_THUMBNAIL_SIZE,
    OUTLINED_MAP_THUMBNAIL_SIZE,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";

export const getOutlinedThumbnail = (
    image: ImageBitmap,
    color: string,
): ImageBitmap => {
    const canvas = new OffscreenCanvas(
        OUTLINED_MAP_THUMBNAIL_SIZE,
        OUTLINED_MAP_THUMBNAIL_SIZE,
    );
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Cannot render map thumbnail outline");
    }
    const radius = OUTLINED_MAP_THUMBNAIL_SIZE / 2;
    context.fillStyle = color;
    context.beginPath();
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.fill();
    context.drawImage(
        image,
        MAP_THUMBNAIL_BORDER_SIZE,
        MAP_THUMBNAIL_BORDER_SIZE,
        MAP_THUMBNAIL_SIZE,
        MAP_THUMBNAIL_SIZE,
    );
    return canvas.transferToImageBitmap();
};
