import { useEffect, useMemo, useState } from "react";
import type { Map } from "maplibre-gl";
import { useSubjectState } from "@tinker-chest";
import { MapLayerData } from "@web-apparatus";
import { imageLayerIds, ImagesLayers, imageSourceIds, selectedImageId$ } from "@the-dead-planet/machine-ward-gears-route-story-common";

export const useImageConnectionsLayer = (
    map: Map,
    connections: GeoJSON.FeatureCollection<GeoJSON.LineString>,
    imageColor: string,
    imageHoverColor: string,
    imageActiveColor: string,
) => {
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const updatedData = useMemo(
        () => ({
            sourceId: imageSourceIds.connections,
            data: connections,
        }),
        [connections],
    );
    const [layerData] = useState<MapLayerData>(() => ({
        sourceId: imageSourceIds.connections,
        source: {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
        },
        layers: [
            {
                id: imageLayerIds.connections,
                type: "line",
                source: imageSourceIds.connections,
                paint: ImagesLayers.connections.getPaint(
                    imageColor,
                    imageHoverColor,
                    imageActiveColor,
                    null,
                ),
            },
        ],
    }));

    useEffect(() => {
        if (map.getLayer(imageLayerIds.connections)) {
            const paint = ImagesLayers.connections.getPaint(
                imageColor,
                imageHoverColor,
                imageActiveColor,
                selectedImageId,
            );
            map.setPaintProperty(imageLayerIds.connections, "line-color", paint["line-color"]);
        }
    }, [map, imageColor, imageHoverColor, imageActiveColor, selectedImageId]);

    return { layerData, updatedData };
};
