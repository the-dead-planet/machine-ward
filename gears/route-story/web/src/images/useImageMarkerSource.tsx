import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useSubjectState } from "@tinker-chest";
import {
    expandedImageGroupId$,
    getImageMarkerGroups,
    getImageMarkerSourceFromGroups,
    getImageSource,
    selectedImageId$,
    imageGroupOffset$,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";

interface ImageGroupCache {
    map: MapLibreMap;
    source: ReturnType<typeof getImageSource>;
    groups: ReturnType<typeof getImageMarkerGroups>;
    coordinates: Map<string, [number, number]>;
}

export const useImageMarkerSource = (
    map: MapLibreMap,
    source: ReturnType<typeof getImageSource>,
    isDisplayingImage: boolean,
) => {
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const [expandedImageGroupId] = useSubjectState(expandedImageGroupId$);
    const [offset] = useSubjectState(imageGroupOffset$);
    const [groupedSource, setGroupedSource] = useState(source);
    const cache = useRef<ImageGroupCache | null>(null);

    useEffect(() => {
        let active = true;
        let revision = 0;
        const update = async () => {
            const currentRevision = ++revision;
            let current = cache.current;
            if (!current || current.map !== map || current.source !== source) {
                current = {
                    map,
                    source,
                    groups: getImageMarkerGroups(source, (coordinate) => {
                        const point = map.project(coordinate);
                        return [point.x, point.y];
                    }),
                    coordinates: new Map(),
                };
                cache.current = current;
            }
            const coordinates = current.coordinates;
            const grouped = await getImageMarkerSourceFromGroups(
                await current.groups,
                (point) => {
                    const key = point.join(",");
                    const cached = coordinates.get(key);
                    if (cached) {
                        return cached;
                    }
                    const coordinate = map.unproject(point);
                    const value: [number, number] = [
                        coordinate.lng,
                        coordinate.lat,
                    ];
                    coordinates.set(key, value);
                    return value;
                },
                selectedImageId,
                isDisplayingImage || map.isMoving()
                    ? null
                    : expandedImageGroupId,
                offset,
            );
            if (active && revision === currentRevision) {
                setGroupedSource(grouped);
            }
        };
        const invalidate = () => {
            cache.current = null;
            void update();
        };
        void update();
        map.on("movestart", invalidate);
        map.on("moveend", invalidate);
        map.on("resize", invalidate);
        return () => {
            active = false;
            map.off("movestart", invalidate);
            map.off("moveend", invalidate);
            map.off("resize", invalidate);
        };
    }, [
        map,
        source,
        selectedImageId,
        expandedImageGroupId,
        offset,
        isDisplayingImage,
    ]);

    return groupedSource;
};
