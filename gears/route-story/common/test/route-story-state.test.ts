import { expect } from "chai";
import { describe, it } from "mocha";
import { BehaviorSubject } from "rxjs";
import { StorageKeeper } from "@apparatus";
import { cleanUpRouteStoryState, defaultRouteStoryState, restoreRouteStoryStyling } from "../src";

describe("Route story saved state", () => {
    it("restores styling without turning hidden layers and slider controls back on", () => {
        const state = cleanUpRouteStoryState({
            markerLayerVisibility: false,
            markerPlayerVisibility: false,
            viewportRangePlayerVisibility: false,
            imageMarkerStyle: { shape: "hexagon", size: "large" },
            routeStyleActive: { width: 8 },
        });

        expect(restoreRouteStoryStyling(state, defaultRouteStoryState)).to.deep.equal({
            ...defaultRouteStoryState,
            markerLayerVisibility: false,
            markerPlayerVisibility: false,
            viewportRangePlayerVisibility: false,
        });
    });

    it("persists independent player and layer visibility with route styling", async () => {
        const values = new Map<string, string>();
        const keeper = new StorageKeeper({
            getItem: async (key) => values.get(key) ?? null,
            setItem: (key, value) => {
                values.set(key, value);
            },
            removeItem: (key) => {
                values.delete(key);
            },
        });
        const state = new BehaviorSubject({ ...defaultRouteStoryState });
        const subscription = await keeper.synchronizeSubjectWithStorage(
            state,
            "route-story:state",
            cleanUpRouteStoryState,
        );
        state.next({ ...state.value, markerPlayerVisibility: false, markerLayerVisibility: false, viewportRangePlayerVisibility: false });
        subscription.unsubscribe();
        const restored = new BehaviorSubject({ ...defaultRouteStoryState });
        const restoredSubscription = await keeper.synchronizeSubjectWithStorage(
            restored,
            "route-story:state",
            cleanUpRouteStoryState,
        );
        expect(restored.value.markerPlayerVisibility).to.equal(false);
        expect(restored.value.markerLayerVisibility).to.equal(false);
        expect(restored.value.viewportRangePlayerVisibility).to.equal(false);
        expect(restored.value.routeStyleActive).to.deep.equal(defaultRouteStoryState.routeStyleActive);
        restoredSubscription.unsubscribe();
    });

    it("defaults missing or invalid visibility values in old saved route states", () => {
        for (const saved of [{}, { markerPlayerVisibility: "false", markerLayerVisibility: null, viewportRangePlayerVisibility: "false" }]) {
            const state = cleanUpRouteStoryState(saved);
            expect(state.markerPlayerVisibility).to.equal(true);
            expect(state.markerLayerVisibility).to.equal(true);
            expect(state.viewportRangePlayerVisibility).to.equal(true);
        }
    });

    it("keeps legacy thumbnail styling and restores valid image marker settings", () => {
        expect(cleanUpRouteStoryState({}).imageMarkerStyle).to.deep.equal({ shape: "circle", size: "medium" });
        expect(cleanUpRouteStoryState({ imageMarkerStyle: { shape: "hexagon", size: "large" } }).imageMarkerStyle)
            .to.deep.equal({ shape: "hexagon", size: "large" });
        expect(cleanUpRouteStoryState({ imageMarkerStyle: { shape: "octagon", size: null } }).imageMarkerStyle)
            .to.deep.equal({ shape: "circle", size: "medium" });
        expect(cleanUpRouteStoryState({ photoMarkers: { shape: "square", size: "small" } }).imageMarkerStyle)
            .to.deep.equal({ shape: "square", size: "small" });
    });

    it("merges nested defaults, preserves saved fields, and rejects invalid icons", () => {
        const state = cleanUpRouteStoryState({
            routeStyleActive: { color: "saved", pointColor: "saved-point", obsolete: true },
            currentPoint: {
                fillColor: "saved-fill",
                icon: "Missing",
                rotationAlignment: "viewport",
                outlineColor: "obsolete",
                outlineWidth: 9,
                shape: "obsolete",
            },
            obsolete: true,
        });

        expect(state).to.deep.equal({
            ...defaultRouteStoryState,
            routeStyleActive: {
                ...defaultRouteStoryState.routeStyleActive,
                color: "saved",
                pointColor: "saved-point",
            },
            currentPoint: {
                ...defaultRouteStoryState.currentPoint,
                fillColor: "saved-fill",
                icon: "Circle",
                rotationAlignment: "viewport",
            },
        });
    });
});
