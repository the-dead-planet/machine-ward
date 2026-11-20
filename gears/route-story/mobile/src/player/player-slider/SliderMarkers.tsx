import { FC, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import {
    RouteStoryTranslationKey,
    RouteTimes,
    Animatrix,
    getDistanceFractionPercent,
    RouteGeometryData,
    getSliderImageMarkers,
    selectedImageId$,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { MobileMap } from "@mobile-apparatus";
import { MobileMarkerImageData } from "../../images/image-parser";
import { SliderMarkerPanToWholeRoute } from "./SliderMarkerPanToWholeRoute";
import { SliderMarkerGroup } from "./SliderMarkerGroup";
import { DraggedSliderMarker } from "./DraggedSliderMarker";
import { useSliderMarkerDrag } from "./useSliderMarkerDrag";

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 8,
        right: 8,
        top: 0,
        bottom: 0,
    },
});

interface Props {
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    map: MobileMap;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    images$: BehaviorSubject<MarkerImage<MobileMarkerImageData>[]>;
    animatrix: Animatrix;
    fitBoundsHandler: (map: MobileMap, boundingBox?: GeoJSON.BBox) => void;
}

export const SliderMarkers: FC<Props> = (props) => {
    const {
        gearId,
        translationKey,
        map,
        data$,
        routeGeometryData$,
        routeTimes$,
        images$,
        animatrix,
        fitBoundsHandler,
    } = props;
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [routeTimes] = useSubjectState(routeTimes$);
    const [images] = useSubjectState(images$);
    const [animationControls] = useSubjectState(animatrix.controls$);
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const [containerWidth, setContainerWidth] = useState(0);
    const { containerRef, panHandlers, draggingPosition } = useSliderMarkerDrag(props);
    const markerGroups =
        geojson && routeGeometryData && routeTimes
            ? getSliderImageMarkers(
                images,
                (fraction) => getDistanceFractionPercent(fraction, geojson, routeGeometryData, routeTimes.startTimeEpoch, routeTimes.duration, animationControls.playbackPacing),
                containerWidth,
                routeGeometryData.totalDistanceMeters,
                selectedImageId,
            )
            : [];

    return (
        <View ref={containerRef} style={styles.container} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)} {...panHandlers}>
            {animationControls.panToWholeRouteAtEnd && <SliderMarkerPanToWholeRoute map={map} data$={data$} animatrix={animatrix} fitBoundsHandler={fitBoundsHandler} />}
            {markerGroups.map((group) => (
                <SliderMarkerGroup
                    key={group.image.id}
                    {...group}
                    gearId={gearId}
                    translationKey={translationKey}
                    map={map}
                    data$={data$}
                    routeGeometryData$={routeGeometryData$}
                />
            ))}
            <DraggedSliderMarker position={draggingPosition} gearId={gearId} translationKey={translationKey} />
        </View>
    );
};
