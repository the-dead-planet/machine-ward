import { FC, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { RouteStoryTranslationKey, RouteTimes, Animatrix, RouteGeometryData } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { MobileMap } from "@mobile-apparatus";
import { MobileMarkerImageData } from "../../../images/image-parser";
import { SliderMarkerPanToWholeRoute } from "./SliderMarkerPanToWholeRoute";
import { SliderMarkerGroups } from "./SliderMarkerGroups";
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
    drag: ReturnType<typeof useSliderMarkerDrag>;
}

export const SliderMarkers: FC<Props> = (props) => {
    const { map, data$, animatrix, fitBoundsHandler } = props;
    const [animationControls] = useSubjectState(animatrix.controls$);
    const [containerWidth, setContainerWidth] = useState(0);
    const { containerRef, draggingPosition } = props.drag;

    return (
        <View
            ref={containerRef}
            collapsable={false}
            pointerEvents="box-none"
            style={styles.container}
            onLayout={(event) => {
                setContainerWidth(event.nativeEvent.layout.width);
            }}
        >
            {animationControls.panToWholeRouteAtEnd ? <SliderMarkerPanToWholeRoute map={map} data$={data$} animatrix={animatrix} fitBoundsHandler={fitBoundsHandler} /> : null}
            <SliderMarkerGroups {...props} width={containerWidth} />
            <DraggedSliderMarker {...props} position={draggingPosition} />
        </View>
    );
};
