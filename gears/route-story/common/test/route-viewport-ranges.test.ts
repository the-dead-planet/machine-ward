import { expect } from "chai";
import { Cartomancer, ChronoLens, GearApparatus, ToolsStation, Translatron } from "@apparatus";
import { GeoJson } from "@tinker-chest";
import { SliderRange } from "@ui";
import { RouteStoryGear, getRouteGeometryData, RouteStoryFile, draggingImage$, draggingPlacement$ } from "../src";

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

it("cancels marker drags on disengage and teardown without moving the image", () => {
    const gear = new TestRouteStoryGear({
        cartomancer: new Cartomancer<unknown>(),
        toolsStation: new ToolsStation<unknown>(),
        translatron: new Translatron(),
    } as GearApparatus<unknown, ChronoLens>);
    gear.images$.next([{ id: 1, name: "marker.jpg", progress: 100, distanceFraction: 0.5 }]);
    try {
        for (const end of [gear.disengage, () => gear.cleanup()]) {
            gear.imageMarkerOperator.toggleImageMarkerGroup([1]);
            draggingImage$.next({ id: 1, interaction: "player" });
            draggingPlacement$.next({ distanceFraction: 0.75, lngLat: { lng: 0, lat: 0 } });
            end();
            expect(draggingImage$.value).to.equal(null);
            expect(draggingPlacement$.value).to.equal(null);
            expect(gear.imageMarkerOperator.selectedImageId$.value).to.equal(null);
            expect(gear.images$.value[0].distanceFraction).to.equal(0.5);
        }
    } finally {
        draggingImage$.next(null);
        draggingPlacement$.next(null);
    }
});

it("clears marker selection when the story is reset and releases the loading flag if cleanup fails", async () => {
    const cartomancer = new Cartomancer<unknown>();
    const toolsStation = new ToolsStation<unknown>();
    const gear = new TestRouteStoryGear({ cartomancer, toolsStation } as GearApparatus<unknown, ChronoLens>);
    gear.imageMarkerOperator.toggleImageMarkerGroup([1, 2]);
    gear.progressMs$.next(100);
    const failure = new Error("Cleanup failed");
    gear.onCleanupStory = async () => { throw failure; };
    const result = await gear.resetStory().catch((error: unknown) => error);
    expect(result).to.equal(failure);
    expect(gear.fileOperator.isLoading$.value).to.equal(false);
    expect(gear.imageMarkerOperator.selectedImageId$.value).to.equal(1);

    gear.onCleanupStory = async () => {};
    await gear.resetStory();
    expect(gear.progressMs$.value).to.equal(0);
    expect(gear.imageMarkerOperator.selectedImageId$.value).to.equal(null);
    expect(gear.imageMarkerOperator.expandedImageGroupId$.value).to.equal(null);
});

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
