import { useEffect } from "react";
import { KeyBinding } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import {
    draggingImage$,
    selectedImageId$,
    updateImageDistanceFraction,
    RouteStoryTranslationKey,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { WebRouteStoryProps } from "../model";
import { getSliderStepDistanceFraction } from "../player/player-slider/slider-markers/tinkers";

type Props = Pick<WebRouteStoryProps, "gearId" | "data$" | "routeTimes$" | "routeGeometryData$" | "images$" | "animatrix">;

export const useImageMarkerKeyboard = ({ gearId, data$, routeTimes$, routeGeometryData$, images$, animatrix }: Props) => {
    const { keysmith } = useWebMachineWard();

    useEffect(() => {
        const shortcuts: {
            description: RouteStoryTranslationKey;
            binding: KeyBinding;
            direction: -1 | 1;
            step: "slider" | "percent";
        }[] = [
                {
                    description: RouteStoryTranslationKey.MoveImageBackward,
                    binding: {
                        key: "ArrowLeft",
                    },
                    direction: -1,
                    step: "slider",
                },
                {
                    description: RouteStoryTranslationKey.MoveImageForward,
                    binding: {
                        key: "ArrowRight",
                    },
                    direction: 1,
                    step: "slider",
                },
                {
                    description: RouteStoryTranslationKey.MoveImageBackwardLargeStep,
                    binding: {
                        key: "ArrowLeft",
                        control: true,
                    },
                    direction: -1,
                    step: "percent",
                },
                {
                    description: RouteStoryTranslationKey.MoveImageForwardLargeStep,
                    binding: {
                        key: "ArrowRight",
                        control: true,
                    },
                    direction: 1,
                    step: "percent",
                },
            ];

        const unregister = shortcuts.map(({ description, binding, direction, step }) => keysmith.register({
            id: `${gearId}.${description}`,
            description: {
                n: gearId,
                t: description,
            },
            binding,
            allowRepeat: true,
            isAvailable: () =>
                draggingImage$.value === null &&
                !!data$.value.geojson?.features.length &&
                routeTimes$.value !== null &&
                routeGeometryData$.value !== null &&
                images$.value.some((image) => image.id === selectedImageId$.value && image.distanceFraction !== undefined),
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
    }, [keysmith, gearId, data$, routeTimes$, routeGeometryData$, images$, animatrix]);
};
