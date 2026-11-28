import { useCallback, useRef } from "react";
import type { GeoJSONSourceRef } from "@maplibre/maplibre-react-native";
import { FeatureStateProps, glitchmitter } from "@apparatus";
import {
    getImageMarkerAnchorId,
    getImageMarkerFeatureId,
    useImageDragState,
} from "@the-dead-planet/machine-ward-gears-route-story-common";

export const useImageDragFeatureState = () => {
    const sourceRef = useRef<GeoJSONSourceRef>(null);

    const apply = useCallback((imageId: number) => {
        const source = sourceRef.current;
        if (!source) {
            return;
        }
        let active = true;
        const update = async (dragging: boolean) => {
            try {
                await Promise.all(
                    [
                        getImageMarkerFeatureId(imageId),
                        getImageMarkerAnchorId(imageId),
                    ].map((id) =>
                        dragging
                            ? source.setFeatureState(
                                  { id },
                                  { [FeatureStateProps.Dragging]: true },
                              )
                            : source.removeFeatureState(
                                  { id },
                                  FeatureStateProps.Dragging,
                              ),
                    ),
                );
            } catch (error: unknown) {
                if (active) {
                    glitchmitter.transmit(
                        "Error updating map image drag state",
                        error,
                    );
                }
            }
        };
        void update(true);

        return () => {
            active = false;
            void update(false);
        };
    }, []);
    
    useImageDragState(apply, "player");

    return sourceRef;
};
