import { expect } from "chai";
import { it } from "mocha";
import { act, createElement } from "react";
import { createRoot } from "test-renderer";
import type { Map as MapLibreMap } from "maplibre-gl";
import { ImageMarkerOperator, ImageMarkerSource } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useImageMarkerSource } from "../src/images/useImageMarkerSource";

it("caches projections and group membership across selection and scrolling, not camera or source changes", async () => {
    const environment = Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
        value: true,
        configurable: true,
    });
    const imageMarkerOperator = new ImageMarkerOperator();
    const { selectedImageId$, expandedImageGroupId$, imageGroupOffset$ } = imageMarkerOperator;
    selectedImageId$.next(1);
    expandedImageGroupId$.next(1);
    imageGroupOffset$.next(0);
    const source: ImageMarkerSource = {
        type: "FeatureCollection",
        features: Array.from({ length: 7 }, (_value, index) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: {
                imageId: index + 1,
                distanceFromStartMeters: 0,
                iconImageId: `image-${index}`,
                iconImageThumbnailId: `thumbnail-${index}`,
            },
        })),
    };
    let projections = 0;
    let unprojections = 0;
    let moving = false;
    let projectionScale = 100;
    const handlers = new Map<string, Set<() => void>>();
    const map = {
        project: ([x, y]: [number, number]) => {
            projections++;
            return { x: x * projectionScale, y: y * projectionScale };
        },
        unproject: ([x, y]: [number, number]) => {
            unprojections++;
            return { lng: x / projectionScale, lat: y / projectionScale };
        },
        isMoving: () => moving,
        on: (event: string, handler: () => void) => {
            const callbacks = handlers.get(event) ?? new Set();
            callbacks.add(handler);
            handlers.set(event, callbacks);
        },
        off: (event: string, handler: () => void) => handlers.get(event)?.delete(handler),
    } as unknown as MapLibreMap;
    let rendered: ImageMarkerSource = source;
    const renderedSources: ImageMarkerSource[] = [];
    const Probe = ({ images }: { images: ImageMarkerSource }) => {
        rendered = useImageMarkerSource(map, images, false, imageMarkerOperator);
        renderedSources.push(rendered);
        return null;
    };
    const emit = (event: string) => handlers.get(event)?.forEach((handler) => handler());
    const root = createRoot();
    try {
        await act(async () => root.render(createElement(Probe, { images: source })));
        expect(projections).to.equal(7);
        expect(unprojections).to.equal(6);
        expect(rendered.features.filter(({ properties }) => properties.markerVisible)).to.have.length(5);
        await act(async () => {
            selectedImageId$.next(2);
        });
        await act(async () => {
            imageGroupOffset$.next(1);
        });
        expect(projections).to.equal(7);
        expect(unprojections).to.equal(6);
        expect(
            rendered.features.find(({ properties }) => properties.imageId === 2)
                ?.properties.markerSelected,
        ).to.equal(true);
        moving = true;
        await act(async () => {
            emit("movestart");
        });
        expect(projections).to.equal(14);
        expect(rendered.features.filter(({ properties }) => properties.markerVisible)).to.have.length(1);
        moving = false;
        projectionScale = 200;
        await act(async () => {
            emit("moveend");
        });
        expect(projections).to.equal(21);
        expect(rendered.features.filter(({ properties }) => properties.markerVisible)).to.have.length(5);
        const moved: ImageMarkerSource = {
            ...source,
            features: source.features.map((feature, index) =>
                index === 0
                    ? {
                          ...feature,
                          geometry: { type: "Point", coordinates: [1, 0] },
                      }
                    : feature,
            ),
        };
        renderedSources.length = 0;
        await act(async () => root.render(createElement(Probe, { images: moved })));
        expect(renderedSources.every((frame) => frame.features.every((feature) => feature.properties.markerVisible !== undefined))).to.equal(true);
        expect(projections).to.equal(28);
        expect(rendered.features.filter(({ properties }) => properties.markerVisible)).to.have.length(2);
        await act(async () => {
            emit("resize");
        });
        expect(projections).to.equal(35);
    } finally {
        await act(async () => root.unmount());
        if (environment) {
            Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", environment);
        } else {
            Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
        }
    }
});
