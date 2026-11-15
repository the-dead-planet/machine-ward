import { expect } from "chai";
import { it } from "mocha";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import type { Map as MapLibreMap, SourceSpecification } from "maplibre-gl";
import { MapLayerData, useMapSourceAndLayers } from "../src/map/hooks/useMapSourceAndLayers";
import { UpdatedData } from "../src/map/hooks/useUpdateSourceData";

it("reapplies unchanged expanded geometry after a theme recreates its source", async () => {
    const environment = Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
        value: true,
        configurable: true,
    });
    const original: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: [],
    };
    const expanded: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: Array.from({ length: 7 }, (_value, imageId) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [imageId, imageId] },
            properties: { imageId, markerVisible: imageId < 5 },
        })),
    };
    let displayed: GeoJSON.GeoJSON | string | undefined;
    let sourceCreations = 0;
    let sourceUpdates = 0;
    const layers = new Set<string>();
    const sources = new Map<string, object>();
    const map = {
        addSource: (sourceId: string, source: SourceSpecification) => {
            if (source.type !== "geojson") {
                throw new Error("Expected a GeoJSON source");
            }
            sourceCreations++;
            displayed = source.data;
            sources.set(sourceId, {
                type: "geojson",
                setData: (value: GeoJSON.GeoJSON) => {
                    sourceUpdates++;
                    displayed = value;
                },
            });
        },
        getSource: (sourceId: string) => sources.get(sourceId),
        removeSource: (sourceId: string) => sources.delete(sourceId),
        addLayer: (layer: { id: string }) => layers.add(layer.id),
        getLayer: (layerId: string) => layers.has(layerId),
        removeLayer: (layerId: string) => layers.delete(layerId),
        moveLayer: () => {},
        on: () => {},
        off: () => {},
    } as unknown as MapLibreMap;
    const data: MapLayerData = {
        sourceId: "images",
        source: { type: "geojson", data: original },
        layers: [
            {
                id: "images-layer",
                source: "images",
                type: "circle",
                paint: { "circle-color": "red" },
            },
        ],
    };
    const updatedData: UpdatedData = { sourceId: "images", data: expanded };
    const Probe = ({ configuration }: { configuration: MapLayerData }) => {
        useMapSourceAndLayers(map, configuration, { updatedData });
        return null;
    };
    const root = createRoot();
    try {
        await act(async () => root.render(createElement(Probe, { configuration: data })));
        expect(displayed).to.equal(expanded);
        const themed: MapLayerData = {
            ...data,
            layers: [
                {
                    id: "images-layer",
                    source: "images",
                    type: "circle",
                    paint: { "circle-color": "blue" },
                },
            ],
        };
        await act(async () => root.render(createElement(Probe, { configuration: themed })));
        expect(sourceCreations).to.equal(2);
        expect(displayed).to.equal(expanded);
        expect(sourceUpdates).to.equal(2);
        await act(async () => root.render(createElement(Probe, { configuration: themed })));
        expect(sourceCreations).to.equal(2);
        expect(sourceUpdates).to.equal(2);
    } finally {
        await act(async () => root.unmount());
        if (environment) {
            Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", environment);
        } else {
            Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
        }
    }
});
