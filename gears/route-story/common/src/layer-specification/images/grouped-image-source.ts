import { FeatureStateProps } from "@apparatus";
import {
    groupImageMarkers,
    MAP_IMAGE_GROUP_RADIUS,
    canGroupImageRouteDistances,
    MAP_IMAGE_GROUP_PAGE_SIZE,
    MAP_IMAGE_GROUP_SLOT_COUNT,
    MAP_IMAGE_GROUP_UNSELECTED_SCALE,
    MAP_IMAGE_GROUP_SELECTED_SCALE,
    MAP_IMAGE_GROUP_RING_RADIUS,
    MAP_IMAGE_MARKER_OFFSET_Y,
    ImageMarkerPosition,
} from "../../tinkers/images";
import {
    ImageFeature,
    ImageMarkerSource,
    ImageGroupPagination,
} from "./images-sources";

type Coordinate = [number, number];

export async function getImageMarkerGroups(
    source: ImageMarkerSource,
    project: (coordinate: Coordinate) => Coordinate | Promise<Coordinate>,
): Promise<ImageMarkerPosition<ImageFeature>[][]> {
    const positions = await Promise.all(
        source.features.map(async (feature) => {
            const [x, y] = await project([
                feature.geometry.coordinates[0],
                feature.geometry.coordinates[1],
            ]);
            return { item: feature, x, y };
        }),
    );
    return groupImageMarkers(
        positions,
        MAP_IMAGE_GROUP_RADIUS,
        (candidate, member) =>
            canGroupImageRouteDistances(
                candidate.properties.distanceFromStartMeters,
                member.properties.distanceFromStartMeters,
            ),
    );
}

export async function getGroupedImageSource(
    source: ImageMarkerSource,
    project: (coordinate: Coordinate) => Coordinate | Promise<Coordinate>,
    unproject: (point: Coordinate) => Coordinate | Promise<Coordinate>,
    selectedImageId: number | null,
    expandedImageGroupId: number | null,
    offset = 0,
): Promise<ImageMarkerSource> {
    const groups = await getImageMarkerGroups(source, project);

    return getImageMarkerSourceFromGroups(
        groups,
        unproject,
        selectedImageId,
        expandedImageGroupId,
        offset,
    );
}

export async function getImageMarkerSourceFromGroups(
    groups: ImageMarkerPosition<ImageFeature>[][],
    unproject: (point: Coordinate) => Coordinate | Promise<Coordinate>,
    selectedImageId: number | null,
    expandedImageGroupId: number | null,
    offset = 0,
): Promise<ImageMarkerSource> {
    const features: ImageFeature[] = [];
    let pagination: ImageGroupPagination | undefined;
    for (const group of groups) {
        const expanded =
            group.length > 1 &&
            group.some(
                ({ item }) => item.properties.imageId === expandedImageGroupId,
            );
        const lead =
            group.find(
                ({ item }) => item.properties.imageId === selectedImageId,
            ) ?? group[0];
        const paged = expanded && group.length > MAP_IMAGE_GROUP_SLOT_COUNT;
        const currentOffset = paged
            ? ((offset % group.length) + group.length) % group.length
            : 0;
        const visibleCount = expanded
            ? Math.min(
                  paged
                      ? MAP_IMAGE_GROUP_PAGE_SIZE
                      : MAP_IMAGE_GROUP_SLOT_COUNT,
                  group.length,
              )
            : 0;
        const center = group.reduce(
            (sum, position) => ({
                x: sum.x + position.x / group.length,
                y: sum.y + position.y / group.length,
            }),
            { x: 0, y: 0 },
        );
        const expandedCoordinates = expanded
            ? await Promise.all(
                  Array.from({ length: visibleCount }, (_value, index) => {
                      const slot = paged
                          ? (index + MAP_IMAGE_GROUP_SLOT_COUNT / 2 + 1) %
                            MAP_IMAGE_GROUP_SLOT_COUNT
                          : index;
                      const angle =
                          (slot * Math.PI * 2) /
                          (paged ? MAP_IMAGE_GROUP_SLOT_COUNT : visibleCount);
                      const x =
                          center.x +
                          Math.sin(angle) * MAP_IMAGE_GROUP_RING_RADIUS;
                      const y =
                          center.y -
                          Math.cos(angle) * MAP_IMAGE_GROUP_RING_RADIUS;
                      return unproject([x, y]);
                  }),
              )
            : [];
        if (paged) {
            pagination = {
                lngLat: await unproject([
                    center.x,
                    center.y + MAP_IMAGE_GROUP_RING_RADIUS,
                ]),
                offset: currentOffset,
                totalCount: group.length,
                hiddenCount: group.length - visibleCount,
            };
        }
        const collapsedCenter = !expanded
            ? await unproject([lead.x, lead.y + MAP_IMAGE_MARKER_OFFSET_Y])
            : undefined;
        for (const [index, position] of group.entries()) {
            const feature = position.item;
            const selected = feature.properties.imageId === selectedImageId;
            const visibleIndex =
                (index - currentOffset + group.length) % group.length;
            const expandedCoordinate = expandedCoordinates[visibleIndex];
            const coordinates =
                expandedCoordinate ?? feature.geometry.coordinates;
            const visible = expanded
                ? visibleIndex < visibleCount
                : position === lead;
            features.push({
                ...feature,
                geometry: { type: "Point", coordinates },
                properties: {
                    ...feature.properties,
                    markerVisible: visible,
                    markerCount:
                        expanded || position !== lead ? 1 : group.length,
                    markerGroupSize: group.length,
                    markerGroupId: group[0].item.properties.imageId,
                    markerExpanded: expanded && visible,
                    markerSlot: visibleIndex,
                    markerCenter:
                        expandedCoordinate ??
                        (position === lead ? collapsedCenter : undefined),
                    markerOpacity:
                        expanded || selectedImageId === null || selected
                            ? 1
                            : 0.45,
                    markerScale:
                        selected && (expanded || group.length === 1)
                            ? MAP_IMAGE_GROUP_SELECTED_SCALE
                            : expanded
                              ? MAP_IMAGE_GROUP_UNSELECTED_SCALE
                              : 1,
                    markerSelected: selected,
                    [FeatureStateProps.Highlight]: selected,
                },
            });
        }
    }
    return { type: "FeatureCollection", features, pagination };
}

export function getImageMarkerConnections(
    original: ImageMarkerSource,
    grouped: ImageMarkerSource,
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
    const originals = new Map(
        original.features.map((feature) => [
            feature.properties.imageId,
            feature,
        ]),
    );
    return {
        type: "FeatureCollection",
        features: grouped.features.flatMap(
            (feature): GeoJSON.Feature<GeoJSON.LineString>[] => {
                const anchor = originals.get(feature.properties.imageId)
                    ?.geometry.coordinates;
                const coordinates = feature.geometry.coordinates;
                if (
                    !feature.properties.markerVisible ||
                    !anchor ||
                    (anchor[0] === coordinates[0] &&
                        anchor[1] === coordinates[1])
                ) {
                    return [];
                }
                return [
                    {
                        type: "Feature",
                        id: feature.properties.imageId,
                        properties: { imageId: feature.properties.imageId },
                        geometry: {
                            type: "LineString",
                            coordinates: [
                                anchor,
                                feature.properties.markerCenter ?? coordinates,
                            ],
                        },
                    },
                ];
            },
        ),
    };
}