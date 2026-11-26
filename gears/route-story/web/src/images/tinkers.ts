import { GearTranslationKey, KeyBinding, Keysmith } from "@apparatus";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable } from "rxjs";
import {
    DRAGGED_IMAGE_ID,
    draggingImage$,
    getMapImageThumbnailOffsetY,
    imageLayerIds,
    MAP_IMAGE_ANCHOR_SIDE,
    THUMBNAIL_IMAGE_SIZE,
    isInsideImageMarker,
    ImageMarkerShape,
    updateImageDistanceFraction,
    RouteStoryTranslationKey,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { WebRouteStoryProps } from "../model";
import { getMarkerSliderMax, getSliderStepDistanceFraction } from "../player/player-slider/slider-markers/tinkers";
import { isLoadedWebImage } from "../hooks/useLoadedWebImages";

type ImageMarkerShortcutContext = Pick<WebRouteStoryProps, "data$" | "routeTimes$" | "routeGeometryData$" | "images$" | "animatrix" | "state$" | "imageMarkerOperator"> & {
    isEngaged$: BehaviorSubject<boolean>;
};

export const registerImageMarkerShortcuts = (
    gearId: string,
    { data$, routeTimes$, routeGeometryData$, images$, animatrix, state$, isEngaged$, imageMarkerOperator }: ImageMarkerShortcutContext,
    keysmith: Keysmith,
    playerActive$: Observable<boolean>,
    isStyleLoaded$: BehaviorSubject<boolean>,
) => {
    const shortcuts: {
        label: RouteStoryTranslationKey;
        binding: KeyBinding;
        direction: -1 | 1;
        step: "slider" | "percent";
    }[] = [
            {
                label: RouteStoryTranslationKey.MoveImageBackward,
                binding: {
                    key: "ArrowLeft",
                },
                direction: -1,
                step: "slider",
            },
            {
                label: RouteStoryTranslationKey.MoveImageForward,
                binding: {
                    key: "ArrowRight",
                },
                direction: 1,
                step: "slider",
            },
            {
                label: RouteStoryTranslationKey.MoveImageBackwardLargeStep,
                binding: {
                    key: "ArrowLeft",
                    control: true,
                },
                direction: -1,
                step: "percent",
            },
            {
                label: RouteStoryTranslationKey.MoveImageForwardLargeStep,
                binding: {
                    key: "ArrowRight",
                    control: true,
                },
                direction: 1,
                step: "percent",
            },
        ];

    const presence$ = combineLatest([isEngaged$, state$, playerActive$, isStyleLoaded$, data$, routeTimes$, routeGeometryData$, images$]).pipe(
        map(([engaged, state, playerActive, styleLoaded, { geojson }, times, geometry, images]) => {
            const mapMarkersPresent = state.markerLayerVisibility && styleLoaded && images.some(isLoadedWebImage);
            const playerMarkersPresent = state.markerPlayerVisibility && playerActive &&
                images.some((image) => image.distanceFraction !== undefined);
            return engaged && !!geojson?.features.length && times !== null && geometry !== null &&
                (mapMarkersPresent || playerMarkersPresent);
        }),
        distinctUntilChanged(),
    );

    const { selectedImageId$ } = imageMarkerOperator;
    const availability$ = combineLatest([draggingImage$, images$, selectedImageId$, routeTimes$, routeGeometryData$, animatrix.controls$]).pipe(
        map(([dragging, images, selectedId, times, geometry, { playbackPacing }]) => dragging === null &&
            times !== null && geometry !== null && getMarkerSliderMax(times, geometry, playbackPacing) !== null &&
            images.some((image) => image.id === selectedId && image.distanceFraction !== undefined),
        ),
        distinctUntilChanged(),
    );

    const unregister = shortcuts.map(({ label, binding, direction, step }) => keysmith.register({
        id: `${gearId}.${label}`,
        owner: { n: gearId, t: GearTranslationKey.GearName },
        label: {
            n: gearId,
            t: label,
        },
        description: {
            n: gearId,
            t: step === "percent" ? RouteStoryTranslationKey.MoveImageLargeStepDescription : RouteStoryTranslationKey.MoveImageStepDescription,
        },
        activationHint: { n: gearId, t: RouteStoryTranslationKey.MoveImageActivationHint },
        requirements: { n: gearId, t: RouteStoryTranslationKey.MoveImageMakeAvailable },
        makeUnavailableHint: { n: gearId, t: RouteStoryTranslationKey.MoveImageMakeUnavailable },
        binding,
        allowRepeat: true,
        presence$,
        availability$,
        execute: () => {
            const image = images$.value.find((image) => image.id === selectedImageId$.value);

            if (image?.distanceFraction === undefined) {
                return;
            }

            const nextDistanceFraction = getSliderStepDistanceFraction(
                image.distanceFraction,
                direction,
                data$.value.geojson,
                routeTimes$.value,
                routeGeometryData$.value,
                animatrix.controls$.value.playbackPacing,
                step,
            );

            if (nextDistanceFraction !== null && nextDistanceFraction !== image.distanceFraction) {
                updateImageDistanceFraction(images$, image.id, nextDistanceFraction);
            }
        },
    }));

    return () => unregister.forEach((dispose) => dispose());
};

interface ImageHitFeature {
    properties: {
        imageId?: number;
        markerAnchor?: boolean;
        markerScale?: number;
        markerSizeScale?: number;
        markerShape?: ImageMarkerShape;
        markerGroupSize?: number;
        markerOffsetY?: number;
    };
    geometry: GeoJSON.Geometry;
    layer: { id: string };
}

export const findMapImageFeature = <T extends ImageHitFeature>(
    features: T[],
    point: { x: number; y: number },
    project: (coordinate: [number, number]) => { x: number; y: number },
): T | undefined => {
    const candidates = features.filter(
        ({ properties, layer }) =>
            properties.imageId !== DRAGGED_IMAGE_ID &&
            layer.id !== imageLayerIds.thumbnailsOutline &&
            layer.id !== imageLayerIds.thumbnailsSelectedOutline,
    );
    return (
        candidates.find(({ properties, geometry }) => {
            if (geometry.type !== "Point") {
                return false;
            }
            const center = project([
                geometry.coordinates[0],
                geometry.coordinates[1],
            ]);

            if (properties.markerAnchor) {
                return (
                    Math.hypot(point.x - center.x, point.y - center.y) <=
                    MAP_IMAGE_ANCHOR_SIDE + 2
                );
            }
            const offset = getMapImageThumbnailOffsetY(properties.markerGroupSize, properties.markerScale, properties.markerOffsetY, properties.markerSizeScale);

            return (
                isInsideImageMarker(point.x - center.x, point.y - center.y - offset,
                    THUMBNAIL_IMAGE_SIZE * (properties.markerScale ?? 1) * (properties.markerSizeScale ?? 1) / 2,
                    properties.markerShape)
            );
        }) ?? candidates[0]
    );
};
