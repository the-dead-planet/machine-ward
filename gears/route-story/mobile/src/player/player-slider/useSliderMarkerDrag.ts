import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, GestureResponderEvent, HostInstance } from "react-native";
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
    selectedImageId$,
    clearImageMarkerSelection,
    toggleImageMarkerGroup,
    updateImageDistanceFraction,
    getDistanceFractionPercent,
    getRoutePlacementAtPercent,
    getSliderImageMarkers,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { MobileMarkerImageData } from "../../images/image-parser";
import { MARKER_ACTION_HEIGHT, MARKER_HEIGHT } from "./slider-markers.styles";

const GRAB_RADIUS_PX = 20;

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
    const dragGestureRef = useRef<{
        startX: number;
        imageId: number;
        imageIds: number[];
        moved: boolean;
    } | null>(null);

    useEffect(() => {
        containerRef.current?.measureInWindow((x, y, width) => {
            containerMetricsRef.current = { pageX: x, pageY: y, width };
        });
    });

    const updateDraggingFeature = (pageX: number) => {
        const gesture = dragGestureRef.current;
        if (!gesture || (!gesture.moved && Math.abs(pageX - gesture.startX) < 4)) {
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

    const tryBeginDragAt = useCallback(
        (event: GestureResponderEvent): boolean => {
            const metrics = containerMetricsRef.current;
            const offsetY = event.nativeEvent.pageY - metrics.pageY;
            if (!geojson || !routeTimes || !routeGeometryData || metrics.width <= 0 || offsetY < MARKER_ACTION_HEIGHT || offsetY > MARKER_ACTION_HEIGHT + MARKER_HEIGHT) {
                return false;
            }
            const offsetX = event.nativeEvent.pageX - metrics.pageX;
            const groups = getSliderImageMarkers(
                images$.value,
                (fraction) => getDistanceFractionPercent(fraction, geojson, routeGeometryData, routeTimes.startTimeEpoch, routeTimes.duration, animationControls.playbackPacing),
                metrics.width,
                routeGeometryData.totalDistanceMeters,
                selectedImageId$.value,
            );
            const grabbed = groups.reduce<(typeof groups)[number] | undefined>((nearest, group) => {
                const distance = Math.abs((group.percent / 100) * metrics.width - offsetX);
                return distance <= GRAB_RADIUS_PX && (!nearest || distance < Math.abs((nearest.percent / 100) * metrics.width - offsetX)) ? group : nearest;
            }, undefined);
            if (grabbed === undefined) {
                return false;
            }
            dragGestureRef.current = {
                startX: event.nativeEvent.pageX,
                imageId: grabbed.image.id,
                imageIds: grabbed.imageIds,
                moved: false,
            };
            draggingPositionRef.current.setValue(grabbed.percent);
            containerRef.current?.measureInWindow((x, y, width) => {
                containerMetricsRef.current = { pageX: x, pageY: y, width };
            });
            return true;
        },
        [images$, geojson, routeTimes, animationControls.playbackPacing, routeGeometryData],
    );

    const responder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponderCapture: (event) => tryBeginDragAt(event),
                onMoveShouldSetPanResponderCapture: () => dragGestureRef.current !== null,
                onPanResponderMove: (_event, gestureState) => updateDraggingFeature(gestureState.moveX),
                onPanResponderRelease: () => endDrag(),
                onPanResponderTerminate: () => endDrag(true),
            }),
        [tryBeginDragAt, geojson, routeTimes, animationControls.playbackPacing, routeGeometryData],
    );

    return { containerRef, panHandlers: responder.panHandlers, draggingPosition: draggingPositionRef.current };
};
