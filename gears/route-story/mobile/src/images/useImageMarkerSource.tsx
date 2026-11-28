import { useEffect, useRef, useState } from "react";
import { auditTime, BehaviorSubject, debounceTime, combineLatest, map as mapValue, of, switchMap, tap, timer } from "rxjs";
import { useMobileMachineWard, MobileMap } from "@mobile-apparatus";
import {
    ImageMarkerOperator,
    ImageMarkerSource,
    getImageMarkerGroups,
    getImageMarkerSourceFromGroups,
    getImageSourceWithAnchors,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { MapImageHitTarget } from "./model";

interface ImageProjectionCache {
    source: ImageMarkerSource;
    groups: ReturnType<typeof getImageMarkerGroups>;
    positions: Map<string, [number, number]>;
    coordinates: Map<string, Promise<[number, number]>>;
}

const hasSameImagePositions = (previous: ImageMarkerSource, next: ImageMarkerSource): boolean =>
    previous === next || (previous.features.length === next.features.length && previous.features.every((feature, index) => {
        const nextFeature = next.features[index];
        return feature.properties.imageId === nextFeature.properties.imageId &&
            feature.geometry.coordinates[0] === nextFeature.geometry.coordinates[0] &&
            feature.geometry.coordinates[1] === nextFeature.geometry.coordinates[1];
    }));

export const useImageMarkerSource = (
    map: MobileMap,
    source: ImageMarkerSource,
    isDisplayingImage: boolean,
    { selectedImageId$, expandedImageGroupId$, imageGroupOffset$ }: ImageMarkerOperator,
) => {
    const { cartomancer } = useMobileMachineWard();
    const [grouping, setGrouping] = useState({ source, groupedSource: source });
    const [input$] = useState(() => new BehaviorSubject({ source, isDisplayingImage }));
    const hitTargets = useRef<MapImageHitTarget[]>([]);
    const paginationTarget = useRef<[number, number] | null>(null);

    useEffect(() => {
        input$.next({ source, isDisplayingImage });
    }, [input$, source, isDisplayingImage]);

    useEffect(() => {
        let active = true;
        let revision = 0;
        let cameraReady = false;
        let cache: ImageProjectionCache | null = null;
        let sourceReady = true;
        let previousSource = input$.value.source;
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
        const sourceUpdates = input$.pipe(switchMap((input) => {
            revision++;
            if (!hasSameImagePositions(previousSource, input.source)) {
                sourceReady = false;
                cache = null;
                hitTargets.current = [];
            }
            previousSource = input.source;
            return sourceReady ? of(input) : timer(100).pipe(
                tap(() => { sourceReady = true; }),
                mapValue(() => input),
            );
        }));
        const subscription = combineLatest([cameraUpdates, selectionUpdates, sourceUpdates])
            .subscribe(async ([_camera, [selectedImageId, expandedImageGroupId, offset], { source, isDisplayingImage }]) => {
                const mapRef = map.map$.value;
                if (!mapRef || !cameraReady || !sourceReady || map.cameraMoving$.value) {
                    return;
                }
                const currentRevision = ++revision;
                let current = cache;
                try {
                    if (current?.source !== source) {
                        const previousGroups = current?.groups;
                        const positions = current?.positions ?? new Map<string, [number, number]>();
                        current = {
                            source,
                            groups: getImageMarkerGroups(source, async (coordinate) => {
                                if (previousGroups) {
                                    await previousGroups;
                                    const cachedPosition = positions.get(coordinate.join(","));
                                    if (cachedPosition) {
                                        return cachedPosition;
                                    }
                                }
                                const point = await mapRef.project(coordinate);
                                positions.set(coordinate.join(","), point);
                                return point;
                            }),
                            positions,
                            coordinates: current?.coordinates ?? new Map(),
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
    }, [map, input$, cartomancer, selectedImageId$, expandedImageGroupId$, imageGroupOffset$]);

    return {
        groupedSource: hasSameImagePositions(grouping.source, source) ? grouping.groupedSource : source,
        hitTargets,
        paginationTarget,
    };
};
