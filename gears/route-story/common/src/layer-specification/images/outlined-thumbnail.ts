import { MAP_IMAGE_MARKER_OUTLINE_WIDTH, MAP_THUMBNAIL_SIZE, THUMBNAIL_IMAGE_SIZE } from "../../tinkers/images";

export const MAP_THUMBNAIL_BORDER_SIZE = (MAP_IMAGE_MARKER_OUTLINE_WIDTH * MAP_THUMBNAIL_SIZE) / THUMBNAIL_IMAGE_SIZE;
export const OUTLINED_MAP_THUMBNAIL_SIZE = MAP_THUMBNAIL_SIZE + MAP_THUMBNAIL_BORDER_SIZE * 2;

export const getOutlinedThumbnailId = (imageId: string, color: string): string => `${imageId}:outline:${color}`;
