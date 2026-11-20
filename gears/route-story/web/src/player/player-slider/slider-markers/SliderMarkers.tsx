import type * as maplibregl from "maplibre-gl";
import { FC, useRef } from "react";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { RouteStoryTranslationKey, RouteTimes, Animatrix, RouteGeometryData } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { WebMarkerImageData } from "../../../images/image-parser";
import { useMarkerContainerWidth } from "./useMarkerContainerWidth";
import { SliderMarkerPanToWholeRoute } from "./SliderMarkerPanToWholeRoute";
import { SliderMarkerGroups } from "./SliderMarkerGroups";
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
    const { map, data$, fitBoundsHandler, animatrix } = props;
    const [animationControls] = useSubjectState(animatrix.controls$);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerWidth = useMarkerContainerWidth(containerRef);
    const drag = useSliderMarkerDrag({ ...props, containerRef });

    return (
        <div ref={containerRef} className={styles["slider-markers"]}>
            {animationControls.panToWholeRouteAtEnd ? <SliderMarkerPanToWholeRoute map={map} data$={data$} animatrix={animatrix} fitBoundsHandler={fitBoundsHandler} /> : null}
            <SliderMarkerGroups {...props} width={containerWidth} drag={drag} />
            <DraggedSliderMarker {...props} />
        </div>
    );
};
