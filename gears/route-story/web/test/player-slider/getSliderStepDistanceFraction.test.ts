import { expect } from "chai";
import { describe, it } from "mocha";
import { GeoJson } from "@tinker-chest";
import { getRouteGeometryData, RouteTimes } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { getSliderStepDistanceFraction } from "../../src/player/player-slider/slider-markers/tinkers";

const geojson: GeoJson = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: { id: 1, time: "1970-01-01T00:00:00.000Z" },
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [1, 0] },
            properties: { id: 2, time: "1970-01-01T00:00:01.000Z" },
        },
    ],
};
const routeTimes: RouteTimes = {
    startTime: "1970-01-01T00:00:00.000Z",
    endTime: "1970-01-01T00:00:01.000Z",
    startTimeEpoch: 0,
    endTimeEpoch: 1000,
    duration: 1000,
};
const routeGeometryData = getRouteGeometryData(geojson);

describe("Slider marker keyboard step", () => {
    it("moves one meter with distance pacing", () => {
        const next = getSliderStepDistanceFraction(0.5, 1, geojson, routeTimes, routeGeometryData, "distance", "slider");

        expect(next).not.to.equal(null);
        expect(next!).to.be.closeTo(0.5 + 1 / routeGeometryData.totalDistanceMeters, 1e-12);
    });

    it("moves one second in either direction with timeline pacing", () => {
        const longerRoute: GeoJson = {
            ...geojson,
            features: geojson.features.map((feature, index) => ({
                ...feature,
                properties: {
                    ...feature.properties,
                    time: index === 0 ? routeTimes.startTime : "1970-01-01T00:00:10.000Z",
                },
            })),
        };
        const longerTimes: RouteTimes = {
            ...routeTimes,
            endTime: "1970-01-01T00:00:10.000Z",
            endTimeEpoch: 10000,
            duration: 10000,
        };

        expect(getSliderStepDistanceFraction(0.5, 1, longerRoute, longerTimes, routeGeometryData, "timeline", "slider")!).to.be.closeTo(0.6, 1e-9);
        expect(getSliderStepDistanceFraction(0.5, -1, longerRoute, longerTimes, routeGeometryData, "timeline", "slider")!).to.be.closeTo(0.4, 1e-9);
    });

    it("moves one percent with either pacing", () => {
        const byDistance = getSliderStepDistanceFraction(0.5, 1, geojson, routeTimes, routeGeometryData, "distance", "percent");
        const byTimeline = getSliderStepDistanceFraction(0.5, 1, geojson, routeTimes, routeGeometryData, "timeline", "percent");

        expect(byDistance!).to.be.closeTo(0.51, 1e-12);
        expect(byTimeline!).to.be.closeTo(0.51, 1e-9);
    });

    it("clamps at the route ends and ignores missing route data", () => {
        expect(getSliderStepDistanceFraction(0, -1, geojson, routeTimes, routeGeometryData, "distance", "slider")).to.equal(0);
        expect(getSliderStepDistanceFraction(1, 1, geojson, routeTimes, routeGeometryData, "timeline", "slider")).to.be.closeTo(1, 1e-9);
        expect(getSliderStepDistanceFraction(0.5, 1, undefined, routeTimes, routeGeometryData, "distance", "slider")).to.equal(null);
    });
});
