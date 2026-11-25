import { GearTranslationKey, KeyBinding, Keysmith, ToolsStation } from "@apparatus";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map } from "rxjs";
import {
    draggingImage$,
    selectedImageId$,
    updateImageDistanceFraction,
    RouteStoryTranslationKey,
    routeStoryPlayerToolId,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { WebRouteStoryProps } from "../model";
import { getSliderStepDistanceFraction } from "../player/player-slider/slider-markers/tinkers";
import { isLoadedWebImage } from "../hooks/useLoadedWebImages";

type Props = Pick<WebRouteStoryProps, "data$" | "routeTimes$" | "routeGeometryData$" | "images$" | "animatrix" | "state$"> & {
    isEngaged$: BehaviorSubject<boolean>;
};

export const registerImageMarkerShortcuts = (
    gearId: string,
    { data$, routeTimes$, routeGeometryData$, images$, animatrix, state$, isEngaged$ }: Props,
    keysmith: Keysmith,
    activeBottomPanelToolId$: ToolsStation<unknown>["activeBottomPanelToolId$"],
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

    const presence$ = combineLatest([isEngaged$, state$, activeBottomPanelToolId$, isStyleLoaded$, data$, routeTimes$, routeGeometryData$, images$]).pipe(
        map(([engaged, state, panelId, styleLoaded, { geojson }, times, geometry, images]) => {
            const mapMarkersPresent = state.markerLayerVisibility && styleLoaded && images.some(isLoadedWebImage);
            const playerMarkersPresent = state.markerPlayerVisibility && panelId === routeStoryPlayerToolId &&
                images.some((image) => image.distanceFraction !== undefined);
            return engaged && !!geojson?.features.length && times !== null && geometry !== null &&
                (mapMarkersPresent || playerMarkersPresent);
        }),
        distinctUntilChanged(),
    );

    const availability$ = combineLatest([draggingImage$, images$, selectedImageId$]).pipe(
        map(([dragging, images, selectedId]) => dragging === null &&
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
        hint: {
            n: gearId,
            t: RouteStoryTranslationKey.MoveImageHint,
        },
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
