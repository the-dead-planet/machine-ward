import { expect } from "chai";
import { Cartomancer, ChronoLens, GearApparatus, ToolsStation } from "@apparatus";
import { GeoJson } from "@tinker-chest";
import { SliderRange } from "@ui";
import { RouteStoryGear, getRouteGeometryData, RouteStoryFile } from "../src";

class TestRouteStoryGear extends RouteStoryGear<unknown, ChronoLens, RouteStoryFile, unknown> {
    public fitBounds = () => {};
    public fileToText = async () => "";
    public readImage = async () => {};
    public onCleanupStory = async () => {};
    public topBarChipComponent = () => null;
    public routeUploadComponent = () => null;
    public layerStylingComponent = () => null;
    public playerComponent = () => null;
    public animatrixHeaderComponent = () => null;
    public animatrixContentComponent = () => null;
    public routeLayerComponent = () => null;
    public imagesLayerComponent = () => null;
}

it("shares viewport ranges lazily and stops calculation for hidden players and unrelated controls", () => {
    const cartomancer = new Cartomancer<unknown>();
    const toolsStation = new ToolsStation<unknown>();
    const gear = new TestRouteStoryGear({ cartomancer, toolsStation } as GearApparatus<unknown, ChronoLens>);
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
    gear.data$.next({ geojson: route });
    gear.routeGeometryData$.next(geometry);
    gear.routeTimes$.next({
        startTime: new Date(0).toISOString(),
        endTime: new Date(1000).toISOString(),
        startTimeEpoch: 0,
        endTimeEpoch: 1000,
        duration: 1000,
    });
    gear.animatrix.controls$.next({ ...gear.animatrix.controls$.value, playbackPacing: "timeline" });
    toolsStation.activeBottomPanelToolId$.next("player");
    cartomancer.bounds$.next([-0.5, -1, 0.5, 1]);
    expect(cartomancer.bounds$.observed).to.equal(false);
    const values: SliderRange[][] = [];
    const subscription = gear.viewportRanges$.subscribe((ranges) => values.push(ranges));
    let mirrored: SliderRange[] = [];
    const secondSubscription = gear.viewportRanges$.subscribe((ranges) => { mirrored = ranges; });
    try {
        expect(values.at(-1)).to.deep.equal([{ start: 250, end: 750 }]);
        expect(mirrored).to.equal(values.at(-1));
        expect(cartomancer.bounds$.observers).to.have.length(1);
        cartomancer.bounds$.next(null);
        expect(values.at(-1)).to.deep.equal([]);
        cartomancer.bounds$.next([-3, -1, 3, 1]);
        expect(values.at(-1)).to.deep.equal([]);
        cartomancer.bounds$.next([-1, -1, 0, 1]);
        expect(values.at(-1)).to.deep.equal([{ start: 0, end: 500 }]);
        gear.animatrix.controls$.next({ ...gear.animatrix.controls$.value, playbackPacing: "distance" });
        expect(values.at(-1)![0].end).to.be.closeTo(geometry.totalDistanceMeters / 2, 0.001);
        const emissionCount = values.length;
        gear.animatrix.controls$.next({ ...gear.animatrix.controls$.value, cameraAngle: 90 });
        expect(values).to.have.length(emissionCount);
        toolsStation.activeBottomPanelToolId$.next(null);
        expect(values.at(-1)).to.deep.equal([]);
        expect(cartomancer.bounds$.observed).to.equal(false);
        expect(gear.animatrix.controls$.observed).to.equal(false);
        cartomancer.bounds$.next([-0.5, -1, 0.5, 1]);
        toolsStation.activeBottomPanelToolId$.next("player");
        expect(values.at(-1)![0].end).to.be.closeTo(geometry.totalDistanceMeters * 0.75, 0.001);
        gear.state$.next({ ...gear.state$.value, viewportRangePlayerVisibility: false });
        expect(values.at(-1)).to.deep.equal([]);
        expect(cartomancer.bounds$.observed).to.equal(false);
        gear.state$.next({ ...gear.state$.value, viewportRangePlayerVisibility: true });
        expect(values.at(-1)![0].start).to.be.closeTo(geometry.totalDistanceMeters / 4, 0.001);
    } finally {
        subscription.unsubscribe();
        secondSubscription.unsubscribe();
    }
    expect(cartomancer.bounds$.observed).to.equal(false);
    expect(toolsStation.activeBottomPanelToolId$.observed).to.equal(false);
});
