import { useEffect, useRef, useState } from "react";
import { ImageMarkerSource } from "./images-sources";
import { getImageMarkerTransition, isImageGroupPaging } from "./image-marker-transition";

export const useAnimatedImageMarkerSource = (
    source: ImageMarkerSource,
    reducedMotion: boolean,
): ImageMarkerSource => {
    const [renderedSource, setRenderedSource] = useState(source);
    const currentSource = useRef(source);
    const previousDistances = new Map(renderedSource.features.map((feature) => [feature.properties.imageId, feature.properties.distanceFromStartMeters]));
    const placementChanged = source.features.some((feature) => {
        const previousDistance = previousDistances.get(feature.properties.imageId);
        return previousDistance !== undefined && previousDistance !== feature.properties.distanceFromStartMeters;
    });

    useEffect(() => {
        const previous = currentSource.current;
        const previousGroup = previous.features.find(({ properties }) => properties.markerExpanded)?.properties.markerGroupId;
        const nextGroup = source.features.find(({ properties }) => properties.markerExpanded)?.properties.markerGroupId;
        const previousFeatures = new Map(previous.features.map((feature) => [feature.properties.imageId, feature]));
        const scaleChanged = source.features.some((feature) => {
            const original = previousFeatures.get(feature.properties.imageId);

            return (
                original?.properties.markerVisible &&
                feature.properties.markerVisible &&
                (original.properties.markerScale ?? 1) !==
                (feature.properties.markerScale ?? 1)
            );
        });

        if (placementChanged || reducedMotion || (previousGroup === nextGroup && !scaleChanged && !isImageGroupPaging(previous, source))) {
            currentSource.current = source;
            setRenderedSource(source);

            return;
        }

        let frame: number;
        let started: number | undefined;
        
        const update = (timestamp: number) => {
            started ??= timestamp;
            const next = getImageMarkerTransition(previous, source, timestamp - started);
            currentSource.current = next;
            setRenderedSource(next);

            if (next !== source) {
                frame = requestAnimationFrame(update);
            }
        };

        frame = requestAnimationFrame(update);

        return () => cancelAnimationFrame(frame);
    }, [source, reducedMotion, placementChanged]);

    return placementChanged ? source : renderedSource;
};
