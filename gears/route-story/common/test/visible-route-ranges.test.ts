import { expect } from "chai";
import { GeoJson } from "@tinker-chest";
import { RouteTimes } from "../src/model";
import { getRouteLngLatAtDistanceFraction, RouteGeometryData } from "../src/tinkers";
import { getVisibleRouteRanges } from "../src/player/player-slider/route-ranges/tinkers";

const makeRoute = (coordinates: GeoJSON.Position[], milliseconds = coordinates.map((_, index) => index * 1000)) => {
    const route: GeoJson = {
        type: "FeatureCollection",
        features: coordinates.map((position, index) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: position },
            properties: {
                id: index,
                time: new Date(milliseconds[index]).toISOString(),
            },
        })),
    };
    const geometry: RouteGeometryData = {
        spline: {
            type: "Feature",
            geometry: { type: "LineString", coordinates },
            properties: {},
        },
        splinePoints: coordinates,
        totalDistanceMeters: 100,
        lookup: coordinates.map((_, index) => ({
            t: index / (coordinates.length - 1),
            lineProgress: index / (coordinates.length - 1),
        })),
    };
    const times: RouteTimes = {
        startTime: new Date(0).toISOString(),
        endTime: new Date(milliseconds.at(-1)!).toISOString(),
        startTimeEpoch: 0,
        endTimeEpoch: milliseconds.at(-1)!,
        duration: milliseconds.at(-1)!,
    };
    return { route, geometry, times };
};

describe("Route viewport ranges", () => {
    it("clips crossings with both endpoints outside and uses the selected pacing", () => {
        const { route, geometry, times } = makeRoute([
            [-2, 0],
            [2, 0],
        ]);
        expect(getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "distance")).to.deep.equal([{ start: 25, end: 75 }]);
        expect(getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "timeline")).to.deep.equal([{ start: 250, end: 750 }]);
        expect(getVisibleRouteRanges(route, geometry, times, [-3, -1, 3, 1], "distance")).to.deep.equal([]);
        expect(getVisibleRouteRanges(route, geometry, times, [-1, 1, 1, 2], "distance")).to.deep.equal([]);
    });

    it("merges connected stretches but preserves off-map gaps and uneven timestamps", () => {
        const { route, geometry, times } = makeRoute(
            [
                [-2, 0],
                [0, 0],
                [2, 0],
                [0, 0],
                [-2, 0],
            ],
            [0, 1000, 5000, 6000, 10000],
        );
        expect(getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "distance")).to.deep.equal([
            { start: 12.5, end: 37.5 },
            { start: 62.5, end: 87.5 },
        ]);
        expect(getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "timeline")).to.deep.equal([
            { start: 500, end: 3000 },
            { start: 5500, end: 8000 },
        ]);
    });

    it("uses the rendered segment rather than inventing a shorter dateline crossing", () => {
        const { route, geometry, times } = makeRoute([[178, 0], [-178, 0]]);
        expect(getRouteLngLatAtDistanceFraction(route, geometry, 0.5)).to.deep.equal({ lng: 0, lat: 0 });
        const ranges = getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "distance");
        expect(ranges).to.have.length(1);
        const [range] = ranges;
        expect(range.start).to.be.lessThan(50);
        expect(range.end).to.be.greaterThan(50);
        expect(getRouteLngLatAtDistanceFraction(route, geometry, range.start / geometry.totalDistanceMeters).lng).to.be.closeTo(1, 0.000001);
        expect(getRouteLngLatAtDistanceFraction(route, geometry, range.end / geometry.totalDistanceMeters).lng).to.be.closeTo(-1, 0.000001);
        expect(getVisibleRouteRanges(route, geometry, times, [179, -1, -179, 1], "distance")).to.deep.equal([]);
    });

    it("handles unwrapped antimeridian geometry, repeated worlds, and separate edges of a wide viewport", () => {
        const { route, geometry, times } = makeRoute([
            [179, 0],
            [181, 0],
        ]);
        for (const bounds of [
            [170, -1, -170, 1],
            [530, -1, 550, 1],
            [-200, -1, 200, 1],
        ] as GeoJSON.BBox[]) {
            expect(getVisibleRouteRanges(route, geometry, times, bounds, "distance")).to.deep.equal([]);
        }
        expect(getVisibleRouteRanges(route, geometry, times, [179.5, -1, -179.5, 1], "distance")).to.deep.equal([{ start: 25, end: 75 }]);
        expect(getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "distance")).to.deep.equal([]);
        expect(getVisibleRouteRanges(route, geometry, times, [-179.5, -1, 179.5, 1], "distance")).to.deep.equal([
            { start: 0, end: 25 },
            { start: 75, end: 100 },
        ]);
    });

    it("handles stationary points and unavailable or invalid input without invented ranges", () => {
        const { route, geometry, times } = makeRoute([
            [0, 0],
            [0, 0],
        ]);
        geometry.totalDistanceMeters = 0;
        expect(getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "timeline")).to.deep.equal([]);
        expect(getVisibleRouteRanges(route, geometry, times, [-1, -1, 1, 1], "distance")).to.deep.equal([]);
        expect(getVisibleRouteRanges(undefined, geometry, times, [-1, -1, 1, 1], "timeline")).to.deep.equal([]);
        expect(getVisibleRouteRanges(route, null, times, [-1, -1, 1, 1], "timeline")).to.deep.equal([]);
        expect(getVisibleRouteRanges(route, geometry, null, [-1, -1, 1, 1], "timeline")).to.deep.equal([]);
        expect(getVisibleRouteRanges(route, geometry, times, null, "timeline")).to.deep.equal([]);
        expect(getVisibleRouteRanges(route, geometry, times, [NaN, -1, 1, 1], "timeline")).to.deep.equal([]);
    });
});
