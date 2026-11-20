import { useEffect, useRef, useState } from "react";
import { auditTime, debounceTime, combineLatest, tap } from "rxjs";
import { useMobileMachineWard, MobileMap } from "@mobile-apparatus";
import {
    expandedImageGroupId$,
    getImageMarkerGroups,
    getImageMarkerSourceFromGroups,
    getImageSource,
    getImageSourceWithAnchors,
    selectedImageId$,
    imageGroupOffset$,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { MapImageHitTarget } from "./model";

interface ImageProjectionCache {
    groups: ReturnType<typeof getImageMarkerGroups>;
    positions: Map<string, [number, number]>;
    coordinates: Map<string, Promise<[number, number]>>;
}

export const useImageMarkerSource = (
    map: MobileMap,
    source: ReturnType<typeof getImageSource>,
    isDisplayingImage: boolean,
) => {
    const { cartomancer } = useMobileMachineWard();
    const [grouping, setGrouping] = useState({ source, groupedSource: source });
    const hitTargets = useRef<MapImageHitTarget[]>([]);
    const paginationTarget = useRef<[number, number] | null>(null);

    useEffect(() => {
        let active = true;
        let revision = 0;
        let cameraReady = false;
        let cache: ImageProjectionCache | null = null;
        const cameraUpdates = combineLatest([
            map.map$,
            map.mapSize$,
            map.cameraMoving$,
            cartomancer.zoom$,
            cartomancer.bearing$,
        ])
            .pipe(
                tap(() => {
                    revision++;
                    cameraReady = false;
                    cache = null;
                    hitTargets.current = [];
                    if (map.cameraMoving$.value) {
                        paginationTarget.current = null;
                    }
                }),
                debounceTime(100),
                tap(() => {
                    cameraReady = true;
                }),
            );
        const selectionUpdates = combineLatest([
            selectedImageId$,
            expandedImageGroupId$,
            imageGroupOffset$,
        ]).pipe(auditTime(0));
        const subscription = combineLatest([cameraUpdates, selectionUpdates])
            .subscribe(async ([_camera, [selectedImageId, expandedImageGroupId, offset]]) => {
                const mapRef = map.map$.value;
                if (!mapRef || !cameraReady || map.cameraMoving$.value) {
                    return;
                }
                const currentRevision = ++revision;
                let current = cache;
                try {
                    if (!current) {
                        const positions = new Map<string, [number, number]>();
                        current = {
                            groups: getImageMarkerGroups(source, async (coordinate) => {
                                const point = await mapRef.project(coordinate);
                                positions.set(coordinate.join(","), point);
                                return point;
                            }),
                            positions,
                            coordinates: new Map(),
                        };
                        cache = current;
                    }
                    const { positions, coordinates } = current;
                    const grouped = await getImageMarkerSourceFromGroups(
                        await current.groups,
                        (point) => {
                            const key = point.join(",");
                            let coordinate = coordinates.get(key);
                            if (!coordinate) {
                                coordinate = mapRef.unproject(point).then((value) => {
                                    positions.set(value.join(","), point);
                                    return value;
                                });
                                coordinates.set(key, coordinate);
                            }
                            return coordinate;
                        },
                        selectedImageId,
                        isDisplayingImage ? null : expandedImageGroupId,
                        offset,
                    );
                    if (active && revision === currentRevision) {
                        const routePositions = new Map(
                            source.features.map((feature) => [
                                feature.properties.imageId,
                                positions.get(feature.geometry.coordinates.join(",")),
                            ]),
                        );
                        hitTargets.current = getImageSourceWithAnchors(source, grouped).features.flatMap(
                            (feature): MapImageHitTarget[] => {
                                const point = positions.get(feature.geometry.coordinates.join(","));
                                const routePoint = routePositions.get(feature.properties.imageId);
                                return feature.properties.markerVisible && point && routePoint
                                    ? [{ feature, point, routePoint }]
                                    : [];
                            },
                        ).sort((left, right) => Number(!!left.feature.properties.markerSelected) - Number(!!right.feature.properties.markerSelected));
                        paginationTarget.current = grouped.pagination
                            ? positions.get(grouped.pagination.lngLat.join(",")) ?? null
                            : null;
                        setGrouping({ source, groupedSource: grouped });
                    }
                } catch {
                    // Projection can finish after the native map has been detached.
                    if (cache === current) {
                        cache = null;
                    }
                }
            });
        return () => {
            active = false;
            hitTargets.current = [];
            subscription.unsubscribe();
        };
    }, [map, source, cartomancer, isDisplayingImage]);

    return {
        groupedSource: grouping.source === source ? grouping.groupedSource : source,
        hitTargets,
        paginationTarget,
    };
};
