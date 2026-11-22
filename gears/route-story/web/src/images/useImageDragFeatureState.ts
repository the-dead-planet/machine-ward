import { useCallback } from "react";
import type { Map } from "maplibre-gl";
import { FeatureStateProps } from "@apparatus";
import {
    getImageMarkerAnchorId,
    getImageMarkerFeatureId,
    imageSourceIds,
    useImageDragState,
} from "@the-dead-planet/machine-ward-gears-route-story-common";

export const useImageDragFeatureState = (map: Map) => {
    const apply = useCallback(
        (imageId: number) => {
            const update = (dragging: boolean) => {
                if (!map.getSource(imageSourceIds.thumbnails)) {
                    return;
                }
                for (const id of [
                    getImageMarkerFeatureId(imageId),
                    getImageMarkerAnchorId(imageId),
                ]) {
                    const feature = { source: imageSourceIds.thumbnails, id };
                    if (dragging) {
                        map.setFeatureState(feature, {
                            [FeatureStateProps.Dragging]: true,
                        });
                    } else {
                        map.removeFeatureState(
                            feature,
                            FeatureStateProps.Dragging,
                        );
                    }
                }
            };
            update(true);
            return () => update(false);
        },
        [map],
    );
    useImageDragState(apply);
};
