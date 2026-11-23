import { useEffect } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
    draggingImage$,
    selectedImageId$,
    updateImageDistanceFraction,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { WebRouteStoryProps } from "../model";
import { getSliderStepDistanceFraction } from "../player/player-slider/slider-markers/tinkers";

type Props = Pick<WebRouteStoryProps, "data$" | "routeTimes$" | "routeGeometryData$" | "images$" | "animatrix"> & {
    map: MapLibreMap;
};

export const useImageMarkerKeyboard = ({ map, data$, routeTimes$, routeGeometryData$, images$, animatrix }: Props) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const imageId = selectedImageId$.value;
            if (imageId === null || draggingImage$.value !== null || event.defaultPrevented || event.isComposing || event.altKey || event.metaKey || event.shiftKey) {
                return;
            }
            const target = event.target;
            if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, button, dialog, [role="dialog"], [role="alertdialog"], [role="slider"], [role="spinbutton"], [role="separator"], [role="combobox"], [role="listbox"], [role="menu"], [role="tablist"], [role="tree"], [role="grid"]'))) {
                return;
            }
            const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
            if (direction === 0) {
                return;
            }
            const distanceFraction = images$.value.find((image) => image.id === imageId)?.distanceFraction;
            if (distanceFraction === undefined) {
                return;
            }
            const nextDistanceFraction = getSliderStepDistanceFraction(
                distanceFraction,
                direction,
                data$.value.geojson,
                routeTimes$.value,
                routeGeometryData$.value,
                animatrix.controls$.value.playbackPacing,
                event.ctrlKey ? "percent" : "slider",
            );
            if (nextDistanceFraction !== null) {
                event.preventDefault();
                if (nextDistanceFraction !== distanceFraction) {
                    updateImageDistanceFraction(images$, imageId, nextDistanceFraction);
                }
            }
        };
        const handleMapKeyDown = (event: KeyboardEvent) => {
            if (event.target === map.getCanvas()) {
                handleKeyDown(event);
                if (event.defaultPrevented) {
                    event.stopPropagation();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keydown", handleMapKeyDown, true);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keydown", handleMapKeyDown, true);
        };
    }, [map, data$, routeTimes$, routeGeometryData$, images$, animatrix]);
};
