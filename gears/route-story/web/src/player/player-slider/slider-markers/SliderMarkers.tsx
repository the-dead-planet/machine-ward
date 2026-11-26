import type * as maplibregl from "maplibre-gl";
import { CSSProperties, FC, useRef } from "react";
import { BehaviorSubject } from "rxjs";
import { MarkerImage } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { RouteStoryTranslationKey, RouteTimes, Animatrix, RouteGeometryData, sliderMarkerSpecification } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useTheme } from "@ui";
import { WebMarkerImageData } from "../../../images/image-parser";
import { useMarkerContainerWidth } from "./useMarkerContainerWidth";
import { SliderMarkerPanToWholeRoute } from "./SliderMarkerPanToWholeRoute";
import { SliderMarkerGroups } from "./SliderMarkerGroups";
import { DraggedSliderMarker } from "./DraggedSliderMarker";
import { useSliderMarkerDrag } from "./useSliderMarkerDrag";
import styles from "./slider-markers.module.css";

import type { ImageMarkerOperator } from "@the-dead-planet/machine-ward-gears-route-story-common";

interface Props {
    imageMarkerOperator: ImageMarkerOperator;
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
    const theme = useTheme();
    const specification = sliderMarkerSpecification;
    const markerStyles: CSSProperties & Record<`--marker-${string}`, string> = {
        "--marker-default-color": theme.color(specification.color, specification.defaultShade),
        "--marker-highlight-color": theme.color(specification.color, specification.highlightedShade),
        "--marker-border-color": theme.color(specification.color, specification.borderShade),
        "--marker-border-width": `${specification.borderWidth}px`,
        "--marker-width": `${specification.stickWidth}px`,
        "--marker-thumb-size": `${specification.diamondSize}px`,
    };

    return (
        <div ref={containerRef} className={styles["slider-markers"]} style={markerStyles}>
            {animationControls.panToWholeRouteAtEnd ? <SliderMarkerPanToWholeRoute map={map} data$={data$} animatrix={animatrix} fitBoundsHandler={fitBoundsHandler} /> : null}
            <SliderMarkerGroups {...props} width={containerWidth} drag={drag} />
            <DraggedSliderMarker {...props} />
        </div>
    );
};
