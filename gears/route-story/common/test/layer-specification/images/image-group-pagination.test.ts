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
import { getImageMarkerTransition } from "../../../src/layer-specification/images/image-marker-transition";
import { MAP_IMAGE_GROUP_RING_RADIUS } from "../../../src/tinkers/images";

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

    it("uses the same color policy and highlight identities for connectors and outlines", async () => {
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
        expect(
            ImagesLayers.connections.getPaint(
                "#123456",
                "#345678",
                "#567890",
                1,
            )["line-color"],
        ).to.deep.equal([
            "case",
            ["==", ["get", "imageId"], 1],
            "#567890",
            ["==", ["feature-state", "highlight"], true],
            "#345678",
            "#123456",
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
