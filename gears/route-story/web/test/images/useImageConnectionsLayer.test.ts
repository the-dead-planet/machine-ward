import { expect } from "chai";
import { it } from "mocha";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import type { Map as MapLibreMap } from "maplibre-gl";
import { imageLayerIds, ImagesLayers, ImageMarkerOperator } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useImageConnectionsLayer } from "../../src/images/useImageConnectionsLayer";

it("retains the connection source and geometry when selection or theme changes its paint", async () => {
    const environment = Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
        value: true,
        configurable: true,
    });
    const imageMarkerOperator = new ImageMarkerOperator();
    const { selectedImageId$ } = imageMarkerOperator;
    const connections: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: "FeatureCollection",
        features: [],
    };
    let paint: unknown;
    const map = {
        getLayer: (id: string) => id === imageLayerIds.connections,
        setPaintProperty: (_id: string, _property: string, value: unknown) => {
            paint = value;
        },
    } as unknown as MapLibreMap;
    const rendered: { current?: ReturnType<typeof useImageConnectionsLayer> } = {};
    const Probe = ({ color }: { color: string }) => {
        rendered.current = useImageConnectionsLayer(
            map,
            connections,
            color,
            "hover",
            "active",
            imageMarkerOperator,
        );
        return null;
    };
    const root = createRoot();
    try {
        await act(async () => root.render(createElement(Probe, { color: "red" })));
        const original = rendered.current;
        await act(async () => {
            selectedImageId$.next(42);
        });
        expect(rendered.current?.layerData).to.equal(original?.layerData);
        expect(rendered.current?.updatedData).to.equal(original?.updatedData);
        expect(paint).to.deep.equal(
            ImagesLayers.connections.getPaint("red", "hover", "active", 42)[
                "line-color"
            ],
        );
        await act(async () => root.render(createElement(Probe, { color: "blue" })));
        expect(rendered.current?.layerData).to.equal(original?.layerData);
        expect(rendered.current?.updatedData).to.equal(original?.updatedData);
        expect(paint).to.deep.equal(
            ImagesLayers.connections.getPaint("blue", "hover", "active", 42)[
                "line-color"
            ],
        );
    } finally {
        await act(async () => root.unmount());
        if (environment) {
            Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", environment);
        } else {
            Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
        }
    }
});
