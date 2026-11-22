import { expect } from "chai";
import { describe, it } from "mocha";
import type * as maplibregl from "maplibre-gl";
import {
    defaultRouteStoryState,
    routeLayerIds,
    routeSourceIds,
    RouteStoryState,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { updateRouteLayer, updateRouteLayerStyle } from "../src/tinkers";

describe("Web route line layers", () => {
    it("applies popup styling through map properties without re-adding layers", () => {
        const updates = new Map<string, unknown>();
        const map = {
            getLayer: (id: string) => (id === routeLayerIds.lineInactiveOutline ? undefined : {}),
            setFilter: (id: string, value: unknown) => updates.set(`${id}/filter`, value),
            setLayoutProperty: (id: string, property: string, value: unknown) =>
                updates.set(`${id}/${property}`, value),
            setPaintProperty: (id: string, property: string, value: unknown) => updates.set(`${id}/${property}`, value),
        } as unknown as maplibregl.Map;
        const state: RouteStoryState = {
            ...defaultRouteStoryState,
            routeStyleActive: {
                ...defaultRouteStoryState.routeStyleActive,
                color: "#123456",
                width: 7,
                pointRadius: 9,
                lineStyle: "solid",
            },
            routeStyleInactive: { ...defaultRouteStoryState.routeStyleInactive, lineStyle: "solid" },
        };

        updateRouteLayerStyle(map, defaultRouteStoryState);
        expect(updates.get(`${routeLayerIds.lineInactive}/line-dasharray`)).to.be.an("array");
        updateRouteLayerStyle(map, state);
        expect(updates.get(`${routeLayerIds.lineActive}/line-color`)).to.equal("#123456");
        expect(updates.get(`${routeLayerIds.lineActive}/line-width`)).to.equal(7);
        expect(updates.get(`${routeLayerIds.lineActive}/visibility`)).to.equal("visible");
        expect(updates.get(`${routeLayerIds.lineActive}/filter`)).to.deep.equal(["==", ["get", "status"], "before"]);
        expect(updates.get(`${routeLayerIds.lineInactive}/line-dasharray`)).to.equal(null);
        expect(updates.get(`${routeLayerIds.lineActive}/line-gradient`)).to.equal(null);
        expect(updates.has(`${routeLayerIds.lineInactiveOutline}/line-color`)).to.equal(false);
        expect(updates.get(`${routeLayerIds.pointsActive}/circle-radius`)).to.equal(9);
    });

    it("updates the correct sources and refreshes active gradients when route data or zoom changes", () => {
        const sources = new Map<string, unknown>();
        const gradients = new Map<string, unknown>();
        let zoom = 10;
        const map = {
            getSource: (id: string) => ({ setData: (data: unknown) => sources.set(id, data) }),
            getZoom: () => zoom,
            setPaintProperty: (id: string, property: string, value: unknown) => {
                expect(property).to.equal("line-gradient");
                gradients.set(id, value);
            },
        } as unknown as maplibregl.Map;
        const line: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { status: "before" },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [0, 0],
                            [1, 0],
                        ],
                    },
                },
            ],
        };
        const currentPoint: GeoJSON.Feature<GeoJSON.Point> = {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [1, 0] },
        };
        const state = {
            ...defaultRouteStoryState,
            routeStyleActive: {
                ...defaultRouteStoryState.routeStyleActive,
                colorTransitionLengthPixels: 100,
            },
        };

        updateRouteLayer(map, line, currentPoint, state);

        expect(sources.get(routeSourceIds.line)).to.equal(line);
        expect(sources.get(routeSourceIds.currentPoint)).to.equal(currentPoint);
        expect([...gradients.keys()]).to.deep.equal([routeLayerIds.lineActiveOutline, routeLayerIds.lineActive]);
        const firstGradient = gradients.get(routeLayerIds.lineActive);
        expect(firstGradient).to.be.an("array");
        line.features[0].geometry.coordinates[1] = [10, 0];
        updateRouteLayer(map, line, currentPoint, state);
        const longerRouteGradient = gradients.get(routeLayerIds.lineActive);
        expect(longerRouteGradient).not.to.deep.equal(firstGradient);
        zoom = 12;
        updateRouteLayer(map, line, currentPoint, state);
        expect(gradients.get(routeLayerIds.lineActive)).not.to.deep.equal(longerRouteGradient);
    });
});
