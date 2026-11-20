import type * as maplibregl from "maplibre-gl";
import { FC, useRef } from "react";
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
import { WebMarkerImageData } from "../../images/image-parser";
import { useMarkerContainerWidth } from "./useMarkerContainerWidth";
import { SliderMarkerPanToWholeRoute } from "./SliderMarkerPanToWholeRoute";
import { SliderMarkerGroup } from "./SliderMarkerGroup";
import { DraggedSliderMarker } from "./DraggedSliderMarker";
import { useSliderMarkerDrag } from "./useSliderMarkerDrag";
import styles from "./slider-markers.module.css";

interface Props {
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    map: maplibregl.Map;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    images$: BehaviorSubject<MarkerImage<WebMarkerImageData>[]>;
    fitBoundsHandler: (map: maplibregl.Map, boundingBox?: GeoJSON.BBox) => void;
    animatrix: Animatrix;
}

export const SliderMarkers: FC<Props> = (props) => {
    const { map, data$, routeGeometryData$, routeTimes$, images$, fitBoundsHandler, animatrix } = props;
    const [{ geojson }] = useSubjectState(data$);
    const [routeGeometryData] = useSubjectState(routeGeometryData$);
    const [routeTimes] = useSubjectState(routeTimes$);
    const [images] = useSubjectState(images$);
    const [animationControls] = useSubjectState(animatrix.controls$);
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerWidth = useMarkerContainerWidth(containerRef);
    const drag = useSliderMarkerDrag({ ...props, containerRef });
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
        <div ref={containerRef} className={styles["slider-markers"]}>
            {animationControls.panToWholeRouteAtEnd ? <SliderMarkerPanToWholeRoute map={map} data$={data$} animatrix={animatrix} fitBoundsHandler={fitBoundsHandler} /> : null}
            {markerGroups.map((group) => (
                <SliderMarkerGroup key={group.image.id} {...props} {...group} drag={drag} />
            ))}
            <DraggedSliderMarker {...props} />
        </div>
    );
};
