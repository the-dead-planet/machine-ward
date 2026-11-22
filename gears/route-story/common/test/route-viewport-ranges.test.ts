import { expect } from "chai";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import { BehaviorSubject } from "rxjs";
import { Cartomancer, MachineWardContext, MachineWardContextValue } from "@apparatus";
import { GeoJson, ParsingResultWithError } from "@tinker-chest";
import { SliderRange } from "@ui";
import { Animatrix, getRouteGeometryData, RouteGeometryData, RouteTimes } from "../src";
import { useVisibleRouteRanges } from "../src/player/player-slider/route-ranges";

it("derives viewport ranges from Cartomancer bounds and pacing and unsubscribes when hidden", async () => {
    const environment = Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
        value: true,
        configurable: true,
    });
    const route: GeoJson = {
        type: "FeatureCollection",
        features: [-1, 1].map((longitude, index) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [longitude, 0] },
            properties: {
                id: index,
                time: new Date(index * 1000).toISOString(),
            },
        })),
    };
    const geometry = getRouteGeometryData(route);
    const times: RouteTimes = {
        startTime: new Date(0).toISOString(),
        endTime: new Date(1000).toISOString(),
        startTimeEpoch: 0,
        endTimeEpoch: 1000,
        duration: 1000,
    };
    const props = {
        data$: new BehaviorSubject<ParsingResultWithError>({ geojson: route }),
        routeGeometryData$: new BehaviorSubject<RouteGeometryData | null>(geometry),
        routeTimes$: new BehaviorSubject<RouteTimes | null>(times),
        animatrix: new Animatrix(),
    };
    props.animatrix.controls$.next({
        ...props.animatrix.controls$.value,
        playbackPacing: "timeline",
    });
    const cartomancer = new Cartomancer<unknown>();
    cartomancer.bounds$.next([-0.5, -1, 0.5, 1]);
    let ranges: SliderRange[] = [];
    const Probe = ({ enabled }: { enabled: boolean }) => {
        ranges = useVisibleRouteRanges({ ...props, enabled });
        return null;
    };
    const context = { cartomancer } as MachineWardContextValue;
    const content = (enabled: boolean) => createElement(MachineWardContext.Provider, { value: context }, createElement(Probe, { enabled }));
    const root = createRoot();
    try {
        await act(async () => root.render(content(true)));
        expect(ranges).to.deep.equal([{ start: 250, end: 750 }]);
        await act(async () => {
            cartomancer.bounds$.next([-3, -1, 3, 1]);
        });
        expect(ranges).to.deep.equal([]);
        await act(async () => {
            cartomancer.bounds$.next([-1, -1, 0, 1]);
        });
        expect(ranges).to.deep.equal([{ start: 0, end: 500 }]);
        await act(async () =>
            props.animatrix.controls$.next({
                ...props.animatrix.controls$.value,
                playbackPacing: "distance",
            }),
        );
        expect(ranges[0].end).to.be.closeTo(geometry.totalDistanceMeters / 2, 0.001);
        await act(async () => {
            cartomancer.bounds$.next([-0.5, -1, 0.5, 1]);
        });
        expect(ranges[0].start).to.be.closeTo(geometry.totalDistanceMeters / 4, 0.001);
        await act(async () => root.render(content(false)));
        expect(ranges).to.deep.equal([]);
        expect(cartomancer.bounds$.observed).to.equal(false);
        await act(async () => root.render(content(true)));
        expect(ranges[0].end).to.be.closeTo(geometry.totalDistanceMeters * 0.75, 0.001);
    } finally {
        await act(async () => root.unmount());
        if (environment) {
            Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", environment);
        } else {
            Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
        }
    }
    expect(cartomancer.bounds$.observed).to.equal(false);
});
