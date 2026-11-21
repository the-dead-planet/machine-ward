import { FC } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { RouteStoryState, RouteStoryTranslationKey, RouteTimes, Animatrix, RouteGeometryData, getRouteDistanceFraction, getRouteTimelinePositionForDistanceFraction } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { Slider } from "@mobile-ui";
import { currentPointRef$, linesRef$ } from "../../layers/RouteLayer";
import { SliderMarkers } from "./slider-markers/SliderMarkers";
import { PlayerSliderLabels } from "./PlayerSliderLabels";
import { MobileMarkerImageData } from "../../images/image-parser";
import { MobileMap } from "@mobile-apparatus";
import { MobilePlayerOperator } from "../../model";
import { useSliderMarkerDrag } from "./slider-markers/useSliderMarkerDrag";

interface Props {
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    map: MobileMap;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    images$: BehaviorSubject<MarkerImage<MobileMarkerImageData>[]>;
    progressMs$: BehaviorSubject<number>;
    playerOperator: MobilePlayerOperator;
    state$: BehaviorSubject<RouteStoryState>;
    animatrix: Animatrix;
    fitBoundsHandler: (map: MobileMap, boundingBox?: GeoJSON.BBox) => void;
    style?: ViewStyle;
}

const styles = StyleSheet.create({
    slider: {
        zIndex: 1,
    },
    sliderContainer: {
        flex: 1,
        gap: 23,
        paddingTop: 19,
        marginTop: 10,
    },
});

export const SliderWithMarkers: FC<Props> = ({
    gearId,
    translationKey,
    map,
    data$,
    routeGeometryData$,
    routeTimes$,
    images$,
    progressMs$,
    playerOperator,
    state$,
    animatrix,
    fitBoundsHandler,
    style,
}) => {
    const [routeTimes] = useSubjectState(routeTimes$);
    const [progressMs] = useSubjectState(progressMs$);
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [animationControls] = useSubjectState(animatrix.controls$);
    const [{ markerPlayerVisibility: showImageMarkers }] = useSubjectState(state$);
    const markerDrag = useSliderMarkerDrag({ data$, routeGeometryData$, routeTimes$, images$, animatrix });

    const handleProgressChange = (value: number) => {
        const nextProgressMs = animationControls.playbackPacing === 'distance' && geojson && routeGeometryData && routeTimes
            ? getRouteTimelinePositionForDistanceFraction(geojson, routeGeometryData, routeTimes.startTimeEpoch, value / Math.max(routeGeometryData.totalDistanceMeters, 1))
            : value;
        playerOperator.updateProgress(nextProgressMs, (line, currentPoint) => {
            linesRef$.next(line);
            currentPointRef$.next(currentPoint);
        });
    };

    return (
        <View
            nativeID="route-story-player-slider"
            collapsable={false}
            pointerEvents="box-none"
            style={[styles.sliderContainer, style]}
        >
            {showImageMarkers ? (
                <SliderMarkers
                    gearId={gearId}
                    translationKey={translationKey}
                    map={map}
                    data$={data$}
                    routeGeometryData$={routeGeometryData$}
                    routeTimes$={routeTimes$}
                    images$={images$}
                    animatrix={animatrix}
                    fitBoundsHandler={fitBoundsHandler}
                    drag={markerDrag}
                />
            ) : null}
            <Slider
                value={animationControls.playbackPacing === 'distance'
                    ? getRouteDistanceFraction(progressMs, geojson, routeTimes, routeGeometryData) * (routeGeometryData?.totalDistanceMeters ?? 1)
                    : progressMs}
                min={0}
                max={animationControls.playbackPacing === 'distance' ? Math.max(routeGeometryData?.totalDistanceMeters ?? 0, 1) : routeTimes?.duration ?? 1}
                step={1}
                onChange={handleProgressChange}
                color="tertiary"
                activeGlow="glow"
                size="sm"
                style={styles.slider}
            />
            <PlayerSliderLabels data$={data$} routeGeometryData$={routeGeometryData$} progressMs$={progressMs$} routeTimes$={routeTimes$} animatrix={animatrix} />
        </View>
    );
};
