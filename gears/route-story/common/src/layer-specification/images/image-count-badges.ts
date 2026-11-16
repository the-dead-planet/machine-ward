import { IMAGE_BADGE_GLYPHS, IMAGE_BADGE_POINTS } from "./image-badge-glyphs";
import { parseColor, toHexColor } from "@ui";

export const IMAGE_COUNT_BADGE_SIZE = 64;
export const IMAGE_COUNT_BADGE_PIXEL_RATIO = 2;

export const getImageCountBadgeImageName = (
    label: string,
    backgroundColor: string,
    textColor: string,
): string => `route-story-image-count-${backgroundColor}-${textColor}-${label}`;

export const getImageCountBadges = (
    backgroundColor: string,
    textColor: string,
) => {
    const opaqueBackground = toHexColor(parseColor(backgroundColor));
    const opaqueText = toHexColor(parseColor(textColor));
    
    return Object.entries(IMAGE_BADGE_GLYPHS).map(([label, glyph]) => ({
        id: getImageCountBadgeImageName(label, backgroundColor, textColor),
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_COUNT_BADGE_SIZE}" height="${IMAGE_COUNT_BADGE_SIZE}" viewBox="0 0 64 64"><polygon points="${IMAGE_BADGE_POINTS}" fill="${opaqueBackground}"/><path d="${glyph}" fill="${opaqueText}"/></svg>`,
    }));
};
