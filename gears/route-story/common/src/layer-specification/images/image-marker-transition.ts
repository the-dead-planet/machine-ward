import { ImageMarkerSource } from "./images-sources";

export const IMAGE_GROUP_ANIMATION_DURATION = 180;
export const IMAGE_GROUP_ANIMATION_STAGGER = 24;

export function getImageMarkerTransition(
    previous: ImageMarkerSource,
    target: ImageMarkerSource,
    elapsed: number,
): ImageMarkerSource {
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

        const expansionChanged =
            !!original.properties.markerExpanded !==
            !!feature.properties.markerExpanded;
        const fromScale = original.properties.markerScale ?? 1;
        const toScale = feature.properties.markerScale ?? 1;
        const scaleChanged =
            original.properties.markerVisible &&
            feature.properties.markerVisible &&
            fromScale !== toScale;

        if (!expansionChanged && !scaleChanged) {
            return feature;
        }

        const slot = expansionChanged
            ? Math.max(
                0,
                (feature.properties.markerExpanded ? feature : original)
                    .properties.markerSlot ?? 0,
            )
            : 0;
        const progress = Math.max(
            0,
            Math.min(
                1,
                (elapsed - slot * IMAGE_GROUP_ANIMATION_STAGGER) /
                IMAGE_GROUP_ANIMATION_DURATION,
            ),
        );

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
        
        const interpolateCenterCoordinate = (index: number): number => {
            const offset = targetCenter
                ? targetCenter[index] - feature.geometry.coordinates[index]
                : (originalCenter?.[index] ??
                    original.geometry.coordinates[index]) -
                original.geometry.coordinates[index];
            const from =
                originalCenter?.[index] ??
                original.geometry.coordinates[index] + offset;
            const to =
                targetCenter?.[index] ??
                feature.geometry.coordinates[index] + offset;

            return from + (to - from) * eased;
        };

        const markerCenter: [number, number] | undefined =
            originalCenter || targetCenter
                ? [
                    interpolateCenterCoordinate(0),
                    interpolateCenterCoordinate(1),
                ]
                : undefined;

        return {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: feature.geometry.coordinates.map(
                    (value, index) =>
                        original.geometry.coordinates[index] +
                        (value - original.geometry.coordinates[index]) * eased,
                ),
            },
            properties: {
                ...feature.properties,
                markerVisible:
                    original.properties.markerVisible ||
                    feature.properties.markerVisible,
                markerCount: expansionChanged
                    ? 1
                    : feature.properties.markerCount,
                markerOpacity: fromOpacity + (toOpacity - fromOpacity) * eased,
                markerScale: fromScale + (toScale - fromScale) * eased,
                markerCenter,
            },
        };
    });
    return complete ? target : { ...target, features };
}
