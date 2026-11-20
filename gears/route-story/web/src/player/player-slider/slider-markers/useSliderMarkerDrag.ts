import { RefObject, useEffect, useRef } from "react";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import {
    Animatrix,
    RouteGeometryData,
    RouteTimes,
    draggingImage$,
    draggingPlacement$,
    updateImageDistanceFraction,
    getRoutePlacementAtPercent,
    clearImageMarkerSelection,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { WebMarkerImageData } from "../../../images/image-parser";

interface Props {
    containerRef: RefObject<HTMLDivElement | null>;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    images$: BehaviorSubject<MarkerImage<WebMarkerImageData>[]>;
    animatrix: Animatrix;
}

export const useSliderMarkerDrag = ({ containerRef, data$, routeGeometryData$, routeTimes$, images$, animatrix }: Props) => {
    const [draggingImage] = useSubjectState(draggingImage$);
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [routeTimes] = useSubjectState(routeTimes$);
    const [animationControls] = useSubjectState(animatrix.controls$);
    const dragStartX = useRef(0);
    const didDrag = useRef(false);

    useEffect(() => {
        if (draggingImage === null || draggingImage.interaction !== "player") {
            return;
        }
        const handleMove = (event: PointerEvent) => {
            if (!didDrag.current && Math.abs(event.clientX - dragStartX.current) < 4) {
                return;
            }
            didDrag.current = true;
            const container = containerRef.current;
            if (!container) {
                return;
            }
            const rectangle = container.getBoundingClientRect();
            const percent = ((event.clientX - rectangle.left) / rectangle.width) * 100;
            const placement = getRoutePlacementAtPercent(percent, geojson, routeTimes, routeGeometryData, animationControls.playbackPacing);
            if (placement !== null) {
                draggingPlacement$.next(placement);
            }
        };
        const handleEnd = (cancelled = false) => {
            const placement = draggingPlacement$.value;
            if (!cancelled && didDrag.current && draggingImage$.value !== null && placement !== null) {
                updateImageDistanceFraction(images$, draggingImage$.value.id, placement.distanceFraction);
            }
            draggingPlacement$.next(null);
            if (didDrag.current) {
                clearImageMarkerSelection();
            }
            draggingImage$.next(null);
        };
        const pointerUpHandler = () => handleEnd();
        const pointerCancelHandler = () => handleEnd(true);
        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", pointerUpHandler);
        window.addEventListener("pointercancel", pointerCancelHandler);
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", pointerUpHandler);
            window.removeEventListener("pointercancel", pointerCancelHandler);
        };
    }, [draggingImage, containerRef, images$, geojson, routeTimes, animationControls.playbackPacing, routeGeometryData]);

    const beginDrag = (imageId: number, clientX: number) => {
        dragStartX.current = clientX;
        didDrag.current = false;
        draggingImage$.next({ id: imageId, interaction: "player" });
    };

    return { beginDrag, didDrag };
};
