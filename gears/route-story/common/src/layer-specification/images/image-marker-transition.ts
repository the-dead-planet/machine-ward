import { ImageMarkerSource } from "./images-sources";
import { MAP_IMAGE_MARKER_OFFSET_Y } from "../../tinkers/images";

export const IMAGE_GROUP_ANIMATION_DURATION = 180;
export const IMAGE_GROUP_ANIMATION_STAGGER = 24;
export const IMAGE_GROUP_PAGING_DURATION = 200;

export function isImageGroupPaging(previous: ImageMarkerSource, target: ImageMarkerSource): boolean {
    const previousGroup = previous.features.find(({ properties }) => properties.markerExpanded)?.properties.markerGroupId;
    const targetGroup = target.features.find(({ properties }) => properties.markerExpanded)?.properties.markerGroupId;

    return (
        !!previous.pagination &&
        !!target.pagination &&
        previousGroup === targetGroup &&
        (previous.pagination.offset !== target.pagination.offset || previous.features.some(({ properties }) => properties.markerRevealScale !== undefined))
    );
}

export function getImageMarkerTransition(
    previous: ImageMarkerSource,
    target: ImageMarkerSource,
    elapsed: number,
): ImageMarkerSource {
    const paging = isImageGroupPaging(previous, target);
    const originals = new Map(
        previous.features.map((feature) => [
            feature.properties.imageId,
            feature,
        ]),
    );
    let complete = true;
    const features = target.features.map((feature) => {
        const original = originals.get(feature.properties.imageId);

        if (!original) {
            return feature;
        }

        if (paging && original.properties.markerGroupId === feature.properties.markerGroupId && (original.properties.markerExpanded || feature.properties.markerExpanded)) {
            const progress = Math.min(1, Math.max(0, elapsed / IMAGE_GROUP_PAGING_DURATION));
            if (progress === 1) {
                return feature;
            }

            complete = false;
            const eased = 1 - (1 - progress) ** 3;
            const from = original.properties.markerVisible ? original : feature;
            const to = feature.properties.markerVisible ? feature : original;
            const interpolateCoordinate = (index: number): number => from.geometry.coordinates[index] + (to.geometry.coordinates[index] - from.geometry.coordinates[index]) * eased;
            const coordinates: [number, number] = [interpolateCoordinate(0), interpolateCoordinate(1)];
            const fromRevealScale = original.properties.markerVisible ? (original.properties.markerRevealScale ?? 1) : 0;
            const toRevealScale = feature.properties.markerVisible ? 1 : 0;
            const fromScale = original.properties.markerScale ?? 1;
            const toScale = feature.properties.markerScale ?? 1;

            return {
                ...feature,
                geometry: {
                    ...feature.geometry,
                    coordinates,
                },
                properties: {
                    ...feature.properties,
                    markerVisible: true,
                    markerExpanded: true,
                    markerCenter: coordinates,
                    markerOffsetY: 0,
                    markerScale: fromScale + (toScale - fromScale) * eased,
                    markerRevealScale: fromRevealScale + (toRevealScale - fromRevealScale) * eased,
                    markerOpacity: 1,
                },
            };
        }

        const expansionChanged = !!original.properties.markerExpanded !== !!feature.properties.markerExpanded;
        const fromScale = original.properties.markerScale ?? 1;
        const toScale = feature.properties.markerScale ?? 1;
        const scaleChanged = original.properties.markerVisible && feature.properties.markerVisible && fromScale !== toScale;

        if (!expansionChanged && !scaleChanged) {
            return feature;
        }

        const slot = expansionChanged
            ? Math.max(0, (feature.properties.markerExpanded ? feature : original).properties.markerSlot ?? 0)
            : 0;
        const progress = Math.max(
            0,
            Math.min(1, (elapsed - slot * IMAGE_GROUP_ANIMATION_STAGGER) / IMAGE_GROUP_ANIMATION_DURATION,));

        if (progress === 1) {
            return feature;
        }

        complete = false;
        const eased = 1 - (1 - progress) ** 3;
        const fromOpacity = original.properties.markerVisible
            ? (original.properties.markerOpacity ?? 1)
            : 0;
        const toOpacity = feature.properties.markerVisible
            ? (feature.properties.markerOpacity ?? 1)
            : 0;
        const originalCenter = original.properties.markerCenter;
        const targetCenter = feature.properties.markerCenter;
        const fromOffset = original.properties.markerOffsetY ?? MAP_IMAGE_MARKER_OFFSET_Y;
        const toOffset = feature.properties.markerOffsetY ?? MAP_IMAGE_MARKER_OFFSET_Y;

        const interpolateCenterCoordinate = (index: number): number => {
            const offset = targetCenter
                ? targetCenter[index] - feature.geometry.coordinates[index]
                : (originalCenter?.[index] ?? original.geometry.coordinates[index]) - original.geometry.coordinates[index];
            const from = originalCenter?.[index] ?? original.geometry.coordinates[index] + offset;
            const to = targetCenter?.[index] ?? feature.geometry.coordinates[index] + offset;

            return from + (to - from) * eased;
        };

        const markerCenter: [number, number] | undefined = originalCenter || targetCenter
            ? [interpolateCenterCoordinate(0), interpolateCenterCoordinate(1)]
            : undefined;

        return {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: feature.geometry.coordinates.map((value, index) => original.geometry.coordinates[index] + (value - original.geometry.coordinates[index]) * eased),
            },
            properties: {
                ...feature.properties,
                markerVisible: original.properties.markerVisible || feature.properties.markerVisible,
                markerCount: expansionChanged ? 1 : feature.properties.markerCount,
                markerOpacity: fromOpacity + (toOpacity - fromOpacity) * eased,
                markerScale: fromScale + (toScale - fromScale) * eased,
                markerCenter,
                markerOffsetY: fromOffset + (toOffset - fromOffset) * eased,
            },
        };
    });

    return complete ? target : { ...target, features };
}
