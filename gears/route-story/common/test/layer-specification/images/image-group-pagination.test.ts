import { expect } from "chai";
import { describe, it } from "mocha";
import { getGroupedImageSource, getImageMarkerConnections } from "../../../src/layer-specification/images/grouped-image-source";
import { ImageMarkerSource, getImageSourceWithAnchors } from "../../../src/layer-specification/images/images-sources";
import ImagesLayers, {
    shiftImageGroup,
    clearImageMarkerSelection,
    expandedImageGroupId$,
    imageGroupOffset$,
    selectMapImageMarker,
} from "../../../src/layer-specification/images/images-layers";
import { getImageMarkerTransition, IMAGE_GROUP_PAGING_DURATION } from "../../../src/layer-specification/images/image-marker-transition";
import { MAP_IMAGE_GROUP_RING_RADIUS } from "../../../src/tinkers/images";
import { createExpression } from "@maplibre/maplibre-gl-style-spec";

const sourceFor = (count: number): ImageMarkerSource => ({
    type: "FeatureCollection",
    features: Array.from({ length: count }, (_value, imageId) => ({
        type: "Feature",
        id: imageId,
        geometry: { type: "Point", coordinates: [imageId % 3, 0] },
        properties: {
            imageId,
            distanceFromStartMeters: 0,
            iconImageId: `image-${imageId}`,
            iconImageThumbnailId: `thumbnail-${imageId}`,
        },
    })),
});
const identity = (point: [number, number]): [number, number] => point;
const visibleIds = (source: ImageMarkerSource) =>
    source.features
        .filter(({ properties }) => properties.markerVisible)
        .sort(
            (left, right) =>
                (left.properties.markerSlot ?? 0) -
                (right.properties.markerSlot ?? 0),
        )
        .map(({ properties }) => properties.imageId);

describe("Expanded map image groups", () => {
    it("keeps collapsed photos 35 screen pixels above their anchors during zoom and rotation", async () => {
        for (const count of [1, 3]) {
            const source = sourceFor(count);
            const grouped = await getGroupedImageSource(source, identity, identity, null, null);
            const photo = getImageSourceWithAnchors(source, grouped).features.find(({ properties }) => properties.markerVisible && !properties.markerAnchor)!;
            expect(photo.properties.markerCenter).to.equal(undefined);
            const offset = createExpression(ImagesLayers.thumbnails.layout["icon-offset"], "icon-offset");
            const size = createExpression(ImagesLayers.thumbnails.layout["icon-size"], "icon-size");
            if (offset.result !== "success" || size.result !== "success") {
                throw new Error("Invalid thumbnail layout expression");
            }
            for (const scale of [1, 2]) {
                for (const bearing of [0, Math.PI / 2]) {
                    const project = ([x, y]: number[]) => [scale * (x * Math.cos(bearing) - y * Math.sin(bearing)), scale * (x * Math.sin(bearing) + y * Math.cos(bearing))];
                    const anchor = project(source.features[photo.properties.imageId].geometry.coordinates);
                    const point = project(photo.geometry.coordinates);
                    const feature: { type: "Point"; properties: typeof photo.properties } = { type: "Point", properties: photo.properties };
                    const [offsetX, offsetY]: number[] = offset.value.evaluate({ zoom: 0 }, feature);
                    const iconSize: number = size.value.evaluate({ zoom: 0 }, feature);
                    expect(point[0] + offsetX * iconSize - anchor[0]).to.be.closeTo(0, 0.00001);
                    expect(point[1] + offsetY * iconSize - anchor[1]).to.be.closeTo(-35, 0.00001);
                }
            }
        }
    });
    it("uses projected thumbnail centers so a pitched group and its counter share the viewport ring", async () => {
        const source = sourceFor(7);
        const project = ([x, y]: [number, number]): [number, number] => [
            x / (1 + y * 0.002),
            y / (1 + y * 0.002),
        ];
        const unproject = ([x, y]: [number, number]): [number, number] => [
            x / (1 - y * 0.002),
            y / (1 - y * 0.002),
        ];
        const expanded = await getGroupedImageSource(
            source,
            project,
            unproject,
            0,
            0,
        );
        const rendered = getImageSourceWithAnchors(source, expanded);
        const centerX = source.features.reduce((sum, feature) => sum + feature.geometry.coordinates[0] / source.features.length, 0);
        for (const feature of rendered.features.filter(({ properties }) => !properties.markerAnchor && properties.markerVisible)) {
            const [x, y] = project([
                feature.geometry.coordinates[0],
                feature.geometry.coordinates[1],
            ]);
            expect(Math.hypot(x - centerX, y)).to.be.closeTo(MAP_IMAGE_GROUP_RING_RADIUS, 0.00001);
        }
        const pagination = expanded.pagination;
        if (!pagination) {
            throw new Error("Expected a group counter");
        }
        const [counterX, counterY] = project(pagination.lngLat);
        expect(counterX).to.be.closeTo(centerX, 0.00001);
        expect(counterY).to.be.closeTo(MAP_IMAGE_GROUP_RING_RADIUS, 0.00001);
    });

    it("enlarges selected standalone markers without adding a connector", async () => {
        const source = sourceFor(1);
        const selected = await getGroupedImageSource(
            source,
            identity,
            identity,
            0,
            null,
        );
        const deselected = await getGroupedImageSource(
            source,
            identity,
            identity,
            null,
            null,
        );
        expect(selected.features[0].properties.markerScale).to.equal(1.1);
        expect(deselected.features[0].properties.markerScale).to.equal(1);
        expect(getImageMarkerConnections(source, selected).features).to.have.length(0);
    });
    it("distributes small groups at equal angles and connects to thumbnail centers", async () => {
        for (const count of [2, 3, 4, 5]) {
            const source = sourceFor(count);
            const expanded = await getGroupedImageSource(
                source,
                identity,
                identity,
                0,
                0,
            );
            const centerX = source.features.reduce((sum, feature) => sum + feature.geometry.coordinates[0] / count, 0);
            const connections = getImageMarkerConnections(source, expanded);
            for (const [index, feature] of expanded.features.entries()) {
                const angle = (index * Math.PI * 2) / count;
                const [x, y] = feature.geometry.coordinates;
                expect(x).to.be.closeTo(centerX + Math.sin(angle) * MAP_IMAGE_GROUP_RING_RADIUS, 0.00001);
                expect(y).to.be.closeTo(-Math.cos(angle) * MAP_IMAGE_GROUP_RING_RADIUS, 0.00001);
                expect(connections.features[index].geometry.coordinates[1]).to.deep.equal(feature.properties.markerCenter);
                expect(feature.properties.markerCenter?.[0]).to.equal(x);
                expect(feature.properties.markerCenter?.[1]).to.be.closeTo(y, 0.00001);
            }
        }
    });

    it("centers six thumbnails on a compact hexagon around the raw screen-point centroid", async () => {
        const source = sourceFor(6);
        const expanded = await getGroupedImageSource(
            source,
            identity,
            identity,
            0,
            0,
        );
        const centerX = source.features.reduce((sum, feature) => sum + feature.geometry.coordinates[0] / 6, 0);
        expect(visibleIds(expanded)).to.have.length(6);
        expect(expanded.pagination).to.equal(undefined);
        expect(expanded.features.map(({ properties }) => properties.markerOpacity)).to.deep.equal([1, 1, 1, 1, 1, 1]);
        expect(expanded.features.map(({ properties }) => properties.markerScale)).to.deep.equal([1.1, 0.9, 0.9, 0.9, 0.9, 0.9]);
        for (const feature of expanded.features) {
            const [x, y] = feature.geometry.coordinates;
            expect(Math.hypot(x - centerX, y)).to.be.closeTo(MAP_IMAGE_GROUP_RING_RADIUS, 0.00001);
        }
        const centers = expanded.features.map(({ geometry }) => geometry.coordinates);
        expect(Math.hypot(centers[0][0] - centers[1][0], centers[0][1] - centers[1][1])).to.be.closeTo(58, 0.00001);
    });

    it("shifts a five-image window one image at a time and wraps in both directions", async () => {
        const source = sourceFor(23);
        for (const [offset, ids] of [
            [0, [0, 1, 2, 3, 4]],
            [1, [1, 2, 3, 4, 5]],
            [22, [22, 0, 1, 2, 3]],
            [-1, [22, 0, 1, 2, 3]],
        ] as [number, number[]][]) {
            const expanded = await getGroupedImageSource(
                source,
                identity,
                identity,
                0,
                0,
                offset,
            );
            expect(visibleIds(expanded)).to.deep.equal(ids);
            expect(expanded.pagination?.offset).to.equal((offset + 23) % 23);
            expect(expanded.pagination?.totalCount).to.equal(23);
            expect(expanded.pagination?.hiddenCount).to.equal(23 - ids.length);
            expect(expanded.pagination?.lngLat[1]).to.equal(MAP_IMAGE_GROUP_RING_RADIUS);
            expect(getImageMarkerConnections(source, expanded).features).to.have.length(ids.length);
            expect(expanded.features.every(({ properties }) => properties.markerGroupId === 0)).to.equal(true);
        }
        const clamped = await getGroupedImageSource(
            source,
            identity,
            identity,
            0,
            0,
            99,
        );
        expect(visibleIds(clamped)).to.deep.equal([7, 8, 9, 10, 11]);
        const small = await getGroupedImageSource(
            sourceFor(6),
            identity,
            identity,
            0,
            0,
            99,
        );
        expect(visibleIds(small)).to.have.length(6);
        const large = await getGroupedImageSource(
            sourceFor(1000),
            identity,
            identity,
            0,
            0,
        );
        expect(visibleIds(large)).to.have.length(5);
    });

    it("moves clockwise from the counter's left edge to its right edge on Next", async () => {
        const source = sourceFor(7);
        const initial = await getGroupedImageSource(
            source,
            identity,
            identity,
            0,
            0,
            0,
        );
        const next = await getGroupedImageSource(
            source,
            identity,
            identity,
            0,
            0,
            6,
        );
        const centerX = source.features.reduce((sum, feature) => sum + feature.geometry.coordinates[0] / 7, 0);
        for (const imageId of [0, 1, 2, 3]) {
            const before = initial.features[imageId].properties.markerCenter;
            const after = next.features[imageId].properties.markerCenter;
            if (!before || !after) {
                throw new Error("Expected a visible thumbnail center");
            }
            const x = before[0] - centerX;
            const y = before[1];
            expect(after[0] - centerX).to.be.closeTo(x * Math.cos(Math.PI / 3) - y * Math.sin(Math.PI / 3), 0.00001);
            expect(after[1]).to.be.closeTo(x * Math.sin(Math.PI / 3) + y * Math.cos(Math.PI / 3), 0.00001);
        }
        expect(next.features[4].properties.markerVisible).to.equal(false);
        expect(next.features[6].properties.markerSlot).to.equal(0);
        expect(next.features[6].properties.markerCenter?.[0]).to.be.lessThan(centerX);
        expect(next.features[6].properties.markerCenter?.[1]).to.be.greaterThan(0);
    });

    it("slides retained thumbnails and scales end thumbnails in place in both paging directions", async () => {
        const source = sourceFor(7);
        const previous = await getGroupedImageSource(source, identity, identity, 0, 0, 0);
        for (const offset of [1, 6]) {
            const target = await getGroupedImageSource(source, identity, identity, 0, 0, offset);
            const start = getImageMarkerTransition(previous, target, 0);
            const middle = getImageMarkerTransition(previous, target, IMAGE_GROUP_PAGING_DURATION / 2);
            const eased = 0.875;
            for (const [imageId, feature] of middle.features.entries()) {
                const before = previous.features[imageId];
                const after = target.features[imageId];
                if (before.properties.markerVisible && after.properties.markerVisible) {
                    for (const coordinate of [0, 1]) {
                        expect(feature.geometry.coordinates[coordinate]).to.be.closeTo(
                            before.geometry.coordinates[coordinate] + (after.geometry.coordinates[coordinate] - before.geometry.coordinates[coordinate]) * eased,
                            0.00001,
                        );
                    }
                    expect(feature.properties.markerScale).to.equal(after.properties.markerScale);
                    expect(feature.properties.markerRevealScale).to.equal(1);
                } else if (before.properties.markerVisible || after.properties.markerVisible) {
                    const entering = !!after.properties.markerVisible;
                    const endpoint = entering ? after : before;
                    expect(feature.geometry).to.deep.equal(endpoint.geometry);
                    expect(feature.properties.markerCenter).to.deep.equal(endpoint.properties.markerCenter);
                    expect(feature.properties.markerRevealScale).to.equal(entering ? eased : 1 - eased);
                    expect(start.features[imageId].properties.markerRevealScale).to.equal(entering ? 0 : 1);
                    expect(feature.properties.markerVisible).to.equal(true);
                    expect(feature.properties.markerOpacity).to.equal(1);
                } else {
                    expect(feature.properties.markerVisible).to.equal(false);
                }
            }
            expect(getImageMarkerTransition(previous, target, IMAGE_GROUP_PAGING_DURATION)).to.equal(target);
        }
    });

    it("retargets rapid forward and reverse clicks from the current positions and scales", async () => {
        const source = sourceFor(7);
        const initial = await getGroupedImageSource(source, identity, identity, 0, 0, 0);
        const next = await getGroupedImageSource(source, identity, identity, 0, 0, 6);
        const interrupted = getImageMarkerTransition(initial, next, 60);
        for (const offset of [0, 5]) {
            const target = await getGroupedImageSource(source, identity, identity, 0, 0, offset);
            const restart = getImageMarkerTransition(interrupted, target, 0);
            for (const feature of interrupted.features.filter(({ properties }) => properties.markerVisible)) {
                const restarted = restart.features[feature.properties.imageId];
                expect(restarted.geometry).to.deep.equal(feature.geometry);
                expect(restarted.properties.markerScale).to.equal(feature.properties.markerScale);
                expect(restarted.properties.markerRevealScale).to.equal(feature.properties.markerRevealScale);
            }
            expect(getImageMarkerTransition(interrupted, target, IMAGE_GROUP_PAGING_DURATION)).to.equal(target);
        }
    });

    it("keeps zero-scale thumbnail and outline offsets finite and centered", async () => {
        const source = sourceFor(7);
        const previous = await getGroupedImageSource(source, identity, identity, 0, 0, 0);
        const target = await getGroupedImageSource(source, identity, identity, 0, 0, 6);
        const entering = getImageMarkerTransition(previous, target, 0).features[6];
        for (const layout of [ImagesLayers.thumbnails.layout, ImagesLayers.thumbnailsOutline.layout]) {
            for (const property of ["icon-size", "icon-offset"] as const) {
                const expression = createExpression(layout[property], property);
                if (expression.result !== "success") {
                    throw new Error("Invalid thumbnail layout expression");
                }
                const value: number | number[] = expression.value.evaluate({ zoom: 0 }, { type: "Point", properties: entering.properties });
                expect(value).to.deep.equal(property === "icon-size" ? 0 : [0, 0]);
            }
        }
    });

    it("preserves the window when picking a group member and resets it on dismissal or a different group", async () => {
        clearImageMarkerSelection();
        selectMapImageMarker(0, 23, 0);
        imageGroupOffset$.next(3);
        const source = await getGroupedImageSource(
            sourceFor(23),
            identity,
            identity,
            0,
            0,
            3,
        );
        const pagination = source.pagination;
        expect(pagination).not.to.equal(undefined);
        if (!pagination) {
            throw new Error("Expected a paged group");
        }
        shiftImageGroup(pagination, 1);
        expect(imageGroupOffset$.value).to.equal(2);
        selectMapImageMarker(5, 23, 0);
        expect(expandedImageGroupId$.value).to.equal(0);
        expect(imageGroupOffset$.value).to.equal(2);
        imageGroupOffset$.next(22);
        shiftImageGroup({ ...pagination, offset: 22 }, -1);
        expect(imageGroupOffset$.value).to.equal(0);
        shiftImageGroup({ ...pagination, offset: 0 }, 1);
        expect(imageGroupOffset$.value).to.equal(22);
        shiftImageGroup({ ...pagination, offset: 0 }, 1);
        expect(imageGroupOffset$.value).to.equal(21);
        selectMapImageMarker(50, 9, 50);
        expect(imageGroupOffset$.value).to.equal(0);
        imageGroupOffset$.next(2);
        clearImageMarkerSelection();
        expect(imageGroupOffset$.value).to.equal(0);
    });

    it("preserves connector identities and geometry when selection changes", async () => {
        const source = sourceFor(3);
        const expanded = await getGroupedImageSource(
            source,
            identity,
            identity,
            1,
            0,
        );
        const connections = getImageMarkerConnections(source, expanded);
        expect(connections.features.map(({ properties }) => properties)).to.deep.equal([{ imageId: 0 }, { imageId: 1 }, { imageId: 2 }]);
        expect(connections.features.map(({ id }) => id)).to.deep.equal([
            0, 1, 2,
        ]);
        const selected = await getGroupedImageSource(
            source,
            identity,
            identity,
            2,
            0,
        );
        expect(getImageMarkerConnections(source, selected)).to.deep.equal(connections);
    });

    it("staggers expansion and keeps outgoing thumbnails until their collapse finishes", async () => {
        const source = sourceFor(3);
        const collapsed = await getGroupedImageSource(
            source,
            identity,
            identity,
            null,
            null,
        );
        const expanded = await getGroupedImageSource(
            source,
            identity,
            identity,
            0,
            0,
        );
        const opening = getImageMarkerTransition(collapsed, expanded, 24);
        expect(opening.features[0].properties.markerOffsetY).to.be.greaterThan(-35).and.lessThan(0);
        expect(opening.features[1].properties.markerOffsetY).to.equal(-35);
        expect(opening.features[0].geometry.coordinates).not.to.deep.equal(collapsed.features[0].geometry.coordinates);
        expect(opening.features[1].geometry.coordinates).to.deep.equal(collapsed.features[1].geometry.coordinates);
        expect(opening.features[2].properties.markerOpacity).to.equal(0);
        expect(getImageMarkerTransition(collapsed, expanded, 400)).to.equal(expanded);
        const closing = getImageMarkerTransition(expanded, collapsed, 24);
        expect(visibleIds(closing)).to.have.length(3);
        expect(getImageMarkerTransition(expanded, collapsed, 400)).to.equal(collapsed);
        expect(visibleIds(collapsed)).to.deep.equal([0]);
    });

    it("transitions selection sizes together without staggering or moving the images", async () => {
        const source = sourceFor(5);
        const previous = await getGroupedImageSource(
            source,
            identity,
            identity,
            0,
            0,
        );
        const target = await getGroupedImageSource(
            source,
            identity,
            identity,
            4,
            0,
        );
        const frame = getImageMarkerTransition(previous, target, 90);
        expect(frame.features[0].properties.markerScale)
            .to.be.greaterThan(0.9)
            .and.lessThan(1.1);
        expect(frame.features[4].properties.markerScale)
            .to.be.greaterThan(0.9)
            .and.lessThan(1.1);
        expect(frame.features[4].properties.markerScale).to.be.closeTo(2 - (frame.features[0].properties.markerScale ?? 0), 0.00001);
        expect(frame.features.map(({ geometry }) => geometry)).to.deep.equal(target.features.map(({ geometry }) => geometry));
        expect(frame.features.map(({ properties }) => properties.markerOpacity)).to.deep.equal([1, 1, 1, 1, 1]);
        expect(getImageMarkerTransition(previous, target, 180)).to.equal(target);
    });
});
