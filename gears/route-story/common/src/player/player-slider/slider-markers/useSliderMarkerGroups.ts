import { BehaviorSubject } from "rxjs";
import { GeoJson, ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { Animatrix } from "../../../animatrix/animatrix";
import { PlaybackPacing } from "../../../animatrix/model";
import { RouteTimes } from "../../../model";
import { selectedImageId$ } from "../../../layer-specification/images/images-layers";
import { getSliderImageMarkers } from "../../../tinkers/images";
import { getDistanceFractionPercent, RouteGeometryData } from "../../../tinkers/source-layers";

interface Props<T> {
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    images$: BehaviorSubject<T[]>;
    animatrix: Animatrix;
}

export function getSliderMarkerGroups<T extends { id: number; distanceFraction?: number }>(
    images: T[],
    geojson: GeoJson | undefined,
    geometry: RouteGeometryData | null,
    times: RouteTimes | null,
    playbackPacing: PlaybackPacing,
    width: number,
    selectedImageId: number | null,
) {
    return geojson && geometry && times
        ? getSliderImageMarkers(
              images,
              (fraction) => getDistanceFractionPercent(fraction, geojson, geometry, times.startTimeEpoch, times.duration, playbackPacing),
              width,
              geometry.totalDistanceMeters,
              selectedImageId,
          )
        : [];
}

export function useSliderMarkerGroups<T extends { id: number; distanceFraction?: number }>(
    { data$, routeGeometryData$, routeTimes$, images$, animatrix }: Props<T>,
    width: number,
) {
    const [{ geojson }] = useSubjectState(data$);
    const [geometry] = useSubjectState(routeGeometryData$);
    const [times] = useSubjectState(routeTimes$);
    const [images] = useSubjectState(images$);
    const [controls] = useSubjectState(animatrix.controls$);
    const [selectedImageId] = useSubjectState(selectedImageId$);

    return getSliderMarkerGroups(images, geojson, geometry, times, controls.playbackPacing, width, selectedImageId);
}
