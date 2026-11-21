import { useRef } from "react";
import { Animated, HostInstance } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { clamp, ParsingResultWithError, useSubjectState } from "@tinker-chest";
import {
    Animatrix,
    RouteGeometryData,
    RouteTimes,
    draggingImage$,
    draggingPlacement$,
    highlightIdsBySourceId$,
    imageSourceIds,
    clearImageMarkerSelection,
    toggleImageMarkerGroup,
    updateImageDistanceFraction,
    getRoutePlacementAtPercent,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { MobileMarkerImageData } from "../../../images/image-parser";

export interface SliderMarkerGestureHandlers {
    beginDrag(imageId: number, imageIds: number[], percent: number, pageX: number): boolean;
    grantDrag(): void;
    moveDrag(pageX: number): void;
    endDrag(cancelled?: boolean): void;
}

interface MarkerGesture {
    startX: number;
    imageId: number;
    imageIds: number[];
    moved: boolean;
    boundsReady: boolean;
    pendingPageX?: number;
}

interface Props {
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    images$: BehaviorSubject<MarkerImage<MobileMarkerImageData>[]>;
    animatrix: Animatrix;
}

export const useSliderMarkerDrag = ({ data$, routeGeometryData$, routeTimes$, images$, animatrix }: Props) => {
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [routeTimes] = useSubjectState(routeTimes$);
    const [animationControls] = useSubjectState(animatrix.controls$);
    const containerRef = useRef<HostInstance>(null);
    const containerMetricsRef = useRef({ pageX: 0, pageY: 0, width: 0 });
    const draggingPositionRef = useRef(new Animated.Value(0));
    const dragGestureRef = useRef<MarkerGesture | null>(null);

    const updateDraggingFeature = (pageX: number) => {
        const gesture = dragGestureRef.current;
        if (!gesture || (!gesture.moved && Math.abs(pageX - gesture.startX) < 4)) {
            return;
        }
        gesture.pendingPageX = pageX;
        if (!gesture.boundsReady) {
            return;
        }
        if (!gesture.moved) {
            gesture.moved = true;
            draggingImage$.next({ id: gesture.imageId, interaction: "player" });
            highlightIdsBySourceId$.next(new Map([[imageSourceIds.thumbnails, new Set([String(gesture.imageId)])]]));
        }
        const metrics = containerMetricsRef.current;
        if (metrics.width <= 0) {
            return;
        }
        const percent = clamp(((pageX - metrics.pageX) / metrics.width) * 100, [0, 100]);
        draggingPositionRef.current.setValue(percent);
        const placement = getRoutePlacementAtPercent(percent, geojson, routeTimes, routeGeometryData, animationControls.playbackPacing);
        if (placement !== null) {
            draggingPlacement$.next(placement);
        }
    };

    const endDrag = (cancelled = false) => {
        const gesture = dragGestureRef.current;
        if (gesture && !gesture.boundsReady && gesture.pendingPageX !== undefined && Math.abs(gesture.pendingPageX - gesture.startX) >= 4) {
            cancelled = true;
        }
        const activeDragImage = draggingImage$.value;
        const placement = draggingPlacement$.value;
        if (!cancelled && gesture?.moved && activeDragImage !== null && placement !== null) {
            updateImageDistanceFraction(images$, activeDragImage.id, placement.distanceFraction);
        }
        draggingPlacement$.next(null);
        if (gesture?.moved) {
            clearImageMarkerSelection();
        }
        highlightIdsBySourceId$.next(new Map());
        draggingImage$.next(null);
        if (!cancelled && gesture && !gesture.moved) {
            toggleImageMarkerGroup(gesture.imageIds);
        }
        dragGestureRef.current = null;
    };

    const beginDrag = (imageId: number, imageIds: number[], percent: number, pageX: number): boolean => {
        const container = containerRef.current;
        if (!container || !geojson || !routeTimes || !routeGeometryData) {
            return false;
        }
        const gesture: MarkerGesture = {
            startX: pageX,
            imageId,
            imageIds,
            moved: false,
            boundsReady: false,
        };
        dragGestureRef.current = gesture;
        draggingPositionRef.current.setValue(percent);
        container.measureInWindow((x, y, width) => {
            if (dragGestureRef.current !== gesture) {
                return;
            }
            containerMetricsRef.current = { pageX: x, pageY: y, width };
            gesture.boundsReady = true;
            if (gesture.pendingPageX !== undefined) {
                updateDraggingFeature(gesture.pendingPageX);
            }
        });
        return true;
    };

    const grantDrag = () => {
        const gesture = dragGestureRef.current;
        if (gesture) {
            highlightIdsBySourceId$.next(new Map([[imageSourceIds.thumbnails, new Set(gesture.imageIds.map(String))]]));
        }
    };

    return { containerRef, beginDrag, grantDrag, moveDrag: updateDraggingFeature, endDrag, draggingPosition: draggingPositionRef.current };
};
