export const THUMBNAIL_IMAGE_SIZE = 50;
export const FULL_SIZE_IMAGE_SIZE = 800;
export const MAP_THUMBNAIL_SIZE = 3 * THUMBNAIL_IMAGE_SIZE;
export const MAP_IMAGE_ANCHOR_SIDE = 4;
export const MAP_IMAGE_ANCHOR_GAP = 4;
export const MAP_IMAGE_MARKER_OFFSET_Y = -(THUMBNAIL_IMAGE_SIZE / 2 + 2 + MAP_IMAGE_ANCHOR_GAP + MAP_IMAGE_ANCHOR_SIDE);
export const MAP_IMAGE_COUNT_BADGE_OFFSET: [number, number] = [20, -20];

export const getMapImageThumbnailOffsetY = (groupSize: number | undefined, scale = 1): number =>
    MAP_IMAGE_MARKER_OFFSET_Y - (groupSize === 1 ? (scale - 1) * THUMBNAIL_IMAGE_SIZE / 2 : 0);

export const getImageIconSize = (
    imageSize: number,
    desiredSize: number,
): number => {
    return 1 / (imageSize / desiredSize);
};

export const MAP_IMAGE_GROUP_RADIUS = THUMBNAIL_IMAGE_SIZE;
export const MAP_IMAGE_GROUP_SLOT_COUNT = 6;
export const MAP_IMAGE_MARKER_OUTLINE_WIDTH = 2;
export const MAP_IMAGE_GROUP_PAGE_SIZE = MAP_IMAGE_GROUP_SLOT_COUNT - 1;
export const MAP_IMAGE_GROUP_UNSELECTED_SCALE = 0.9;
export const MAP_IMAGE_GROUP_SELECTED_SCALE = 1.1;
export const MAP_IMAGE_GROUP_PAGER_BUTTON_SIZE = 44;
export const MAP_IMAGE_GROUP_RING_RADIUS =
    (THUMBNAIL_IMAGE_SIZE + 8) /
    (2 * Math.sin(Math.PI / MAP_IMAGE_GROUP_SLOT_COUNT));
export const IMAGE_GROUP_MAX_ROUTE_DISTANCE_METERS = 100;
export const SLIDER_IMAGE_GROUP_RADIUS = 12;

export const formatImageMarkerCount = (count: number): string => count > 9 ? "9+" : String(count);

export const canGroupImageRouteDistances = (
    candidateDistanceMeters: number,
    memberDistanceMeters: number,
): boolean =>
    Math.abs(candidateDistanceMeters - memberDistanceMeters) <=
    IMAGE_GROUP_MAX_ROUTE_DISTANCE_METERS;

export interface ImageMarkerPosition<T> {
    item: T;
    x: number;
    y: number;
}

/** Groups against a fixed anchor, so chains of nearby images cannot swallow a whole route. */
export function groupImageMarkers<T>(
    positions: ImageMarkerPosition<T>[],
    radius: number,
    canGroup: (candidate: T, member: T) => boolean = () => true,
): ImageMarkerPosition<T>[][] {
    const groups: ImageMarkerPosition<T>[][] = [];
    for (const position of positions) {
        const group = groups.find(
            (members) =>
                Math.hypot(position.x - members[0].x, position.y - members[0].y) < radius &&
                members.every(({ item }) => canGroup(position.item, item)),
        );
        if (group) {
            group.push(position);
        } else {
            groups.push([position]);
        }
    }
    return groups;
}

export function getSliderImageMarkers<
    T extends { id: number; distanceFraction?: number },
>(
    images: T[],
    getPercent: (distanceFraction: number) => number,
    width: number,
    totalDistanceMeters: number,
    selectedImageId: number | null,
) {
    const positions = images.flatMap((image) =>
        image.distanceFraction === undefined
            ? []
            : [
                  {
                      item: image,
                      x: (getPercent(image.distanceFraction) * width) / 100,
                      y: 0,
                  },
              ],
    );
    return groupImageMarkers(
        positions,
        width > 0 ? SLIDER_IMAGE_GROUP_RADIUS : 0,
        (candidate, member) =>
            canGroupImageRouteDistances(candidate.distanceFraction! * totalDistanceMeters, member.distanceFraction! * totalDistanceMeters),
    ).map((group) => {
        const lead = group.find(({ item }) => item.id === selectedImageId) ?? group[0];
        return {
            image: lead.item,
            percent: getPercent(lead.item.distanceFraction!),
            imageIds: group.map(({ item }) => item.id),
        };
    });
}
