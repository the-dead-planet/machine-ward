import { useEffect, useRef, useState } from "react";
import { ImageMarkerSource } from "./images-sources";
import { getImageMarkerTransition } from "./image-marker-transition";

export const useAnimatedImageMarkerSource = (
    source: ImageMarkerSource,
    reducedMotion: boolean,
): ImageMarkerSource => {
    const [renderedSource, setRenderedSource] = useState(source);
    const currentSource = useRef(source);

    useEffect(() => {
        const previous = currentSource.current;
        const previousGroup = previous.features.find(
            ({ properties }) => properties.markerExpanded,
        )?.properties.markerGroupId;
        const nextGroup = source.features.find(
            ({ properties }) => properties.markerExpanded,
        )?.properties.markerGroupId;
        const previousFeatures = new Map(
            previous.features.map((feature) => [
                feature.properties.imageId,
                feature,
            ]),
        );
        const scaleChanged = source.features.some((feature) => {
            const original = previousFeatures.get(feature.properties.imageId);

            return (
                original?.properties.markerVisible &&
                feature.properties.markerVisible &&
                (original.properties.markerScale ?? 1) !==
                    (feature.properties.markerScale ?? 1)
            );
        });

        if (reducedMotion || (previousGroup === nextGroup && !scaleChanged)) {
            currentSource.current = source;
            setRenderedSource(source);
            return;
        }

        let frame: number;
        let started: number | undefined;
        const update = (timestamp: number) => {
            started ??= timestamp;
            const next = getImageMarkerTransition(
                previous,
                source,
                timestamp - started,
            );
            currentSource.current = next;
            setRenderedSource(next);

            if (next !== source) {
                frame = requestAnimationFrame(update);
            }
        };
        
        frame = requestAnimationFrame(update);

        return () => cancelAnimationFrame(frame);
    }, [source, reducedMotion]);

    return renderedSource;
};
