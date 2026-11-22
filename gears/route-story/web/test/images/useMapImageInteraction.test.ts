import { expect } from "chai";
import { it } from "mocha";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import type { Map as MapLibreMap, MapGeoJSONFeature, MapMouseEvent } from "maplibre-gl";
import { BehaviorSubject } from "rxjs";
import {
    defaultRouteStoryState,
    draggingImage$,
    draggingPlacement$,
    expandedImageGroupId$,
    highlightIdsBySourceId$,
    imageGroupOffset$,
    imageLayerIds,
    imageSourceIds,
    selectedImageId$,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useMapImageInteraction } from "../../src/images/useMapImageInteraction";
import { WebRouteStoryProps } from "../../src/model";

it("keeps handlers stable, distinguishes taps from drags, preserves grab offsets, and cleans up map listeners", async () => {
    const environment = Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
        value: true,
        configurable: true,
    });
    const previous = {
        selected: selectedImageId$.value,
        expanded: expandedImageGroupId$.value,
        offset: imageGroupOffset$.value,
        dragging: draggingImage$.value,
        placement: draggingPlacement$.value,
        highlights: highlightIdsBySourceId$.value,
    };
    draggingImage$.next(null);
    selectedImageId$.next(null);
    const listeners = new Map<string, Set<(event: MapMouseEvent) => void>>();
    const canvas = { style: { cursor: "" } };
    let panning = true;
    let projected: [number, number] | undefined;
    const map = {
        getCanvas: () => canvas,
        project: ([x, y]: [number, number]) => ({ x, y }),
        unproject: (point: [number, number]) => {
            projected = point;
            return { lng: point[0], lat: point[1] };
        },
        getSource: () => ({}),
        setFeatureState: () => {},
        removeFeatureState: () => {},
        dragPan: {
            enable: () => {
                panning = true;
            },
            disable: () => {
                panning = false;
            },
        },
        on: (event: string, handler: (event: MapMouseEvent) => void) => {
            const callbacks = listeners.get(event) ?? new Set();
            callbacks.add(handler);
            listeners.set(event, callbacks);
        },
        off: (event: string, handler: (event: MapMouseEvent) => void) => listeners.get(event)?.delete(handler),
    } as unknown as MapLibreMap;
    const options: Parameters<typeof useMapImageInteraction>[0] = {
        map,
        images$: new BehaviorSubject<WebRouteStoryProps["images$"]["value"]>([]),
        state$: new BehaviorSubject(defaultRouteStoryState),
        loadedImages: [],
        geojson: { type: "FeatureCollection", features: [] },
        routeGeometryData: null,
        sourceDataGeojson: {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [100, 10] },
                    properties: {
                        imageId: 1,
                        distanceFromStartMeters: 0,
                        iconImageId: "photo",
                        iconImageThumbnailId: "thumbnail",
                    },
                },
            ],
        },
    };
    let handlers: ReturnType<typeof useMapImageInteraction> = {};
    const Probe = () => {
        handlers = useMapImageInteraction(options);
        return null;
    };
    const feature = {
        ...options.sourceDataGeojson.features[0],
        layer: { id: imageLayerIds.thumbnails },
    } as unknown as MapGeoJSONFeature;
    const hit = {
        features: [feature],
        allFeatures: [feature],
        isTopRelated: true,
    };
    const event = (x: number): MapMouseEvent =>
        ({
            point: { x, y: 10 },
            lngLat: { lng: x, lat: 10 },
            preventDefault: () => {},
        }) as unknown as MapMouseEvent;
    const root = createRoot();
    try {
        await act(async () => root.render(createElement(Probe)));
        const originalHandlers = handlers;
        await act(async () => root.render(createElement(Probe)));
        expect(handlers).to.equal(originalHandlers);
        handlers.onClick?.(hit, event(110));
        expect(selectedImageId$.value).to.equal(1);
        handlers.onMouseMove?.(hit, event(110));
        const highlights = highlightIdsBySourceId$.value;
        handlers.onMouseMove?.(hit, event(110));
        expect(highlightIdsBySourceId$.value).to.equal(highlights);
        expect(highlights.get(imageSourceIds.thumbnails)?.has("1")).to.equal(true);
        await act(async () => {
            handlers.onMouseDown?.(hit, event(110));
        });
        expect(panning).to.equal(false);
        expect(listeners.get("mousemove")?.size).to.equal(1);
        await act(async () =>
            listeners
                .get("mousemove")
                ?.forEach((handler) => handler(event(111))),
        );
        expect(projected).to.equal(undefined);
        await act(async () =>
            listeners
                .get("mousemove")
                ?.forEach((handler) => handler(event(120))),
        );
        expect(projected).to.deep.equal([110, 10]);
        handlers.onClick?.(hit, event(120));
        expect(selectedImageId$.value).to.equal(1);
        await act(async () => root.unmount());
        expect(panning).to.equal(true);
        expect([...listeners.values()].every((callbacks) => callbacks.size === 0)).to.equal(true);
        expect(draggingPlacement$.value).to.equal(null);
    } finally {
        await act(async () => root.unmount());
        selectedImageId$.next(previous.selected);
        expandedImageGroupId$.next(previous.expanded);
        imageGroupOffset$.next(previous.offset);
        draggingImage$.next(previous.dragging);
        draggingPlacement$.next(previous.placement);
        highlightIdsBySourceId$.next(previous.highlights);
        if (environment) {
            Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", environment);
        } else {
            Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
        }
    }
});
