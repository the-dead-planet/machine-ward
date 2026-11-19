import { useEffect, useRef } from "react";
import type { GeoJSONSourceRef } from "@maplibre/maplibre-react-native";
import { distinctUntilChanged, map } from "rxjs";
import { FeatureStateProps, glitchmitter } from "@apparatus";
import {
    draggingImage$,
    getImageMarkerAnchorId,
    getImageMarkerFeatureId,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";

export const useImageDragFeatureState = () => {
    const sourceRef = useRef<GeoJSONSourceRef>(null);

    useEffect(() => {
        const source = sourceRef.current;
        if (!source) {
            return;
        }
        let active = true;
        let imageId: number | null = null;
        const update = async (imageId: number, dragging: boolean) => {
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
        const subscription = draggingImage$
            .pipe(
                map((image) => image?.id ?? null),
                distinctUntilChanged(),
            )
            .subscribe((nextImageId) => {
                if (imageId !== null) {
                    void update(imageId, false);
                }
                imageId = nextImageId;
                if (imageId !== null) {
                    void update(imageId, true);
                }
            });

        return () => {
            active = false;
            subscription.unsubscribe();
            if (imageId !== null) {
                void update(imageId, false);
            }
        };
    }, []);

    return sourceRef;
};
