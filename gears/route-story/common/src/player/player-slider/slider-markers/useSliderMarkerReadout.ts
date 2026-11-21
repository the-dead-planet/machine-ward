import { BehaviorSubject } from "rxjs";
import { useMachineWard } from "@apparatus";
import { formatDistance, ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { useTheme } from "@ui";
import { Animatrix } from "../../../animatrix";
import { draggingPlacement$ } from "../../../layer-specification/images/images-layers";
import { RouteTimes } from "../../../model";
import { getDistanceFractionPercent, getRouteTimelinePositionForDistanceFraction, RouteGeometryData } from "../../../tinkers/source-layers";

export interface SliderMarkerReadoutProps {
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    animatrix: Animatrix;
    distanceFraction?: number;
}

export const useSliderMarkerReadout = ({ data$, routeGeometryData$, routeTimes$, animatrix, distanceFraction }: SliderMarkerReadoutProps) => {
    const [placement] = useSubjectState(draggingPlacement$);
    const [{ geojson }] = useSubjectState(data$);
    const [geometry] = useSubjectState(routeGeometryData$);
    const [times] = useSubjectState(routeTimes$);
    const [controls] = useSubjectState(animatrix.controls$);
    const { individuator } = useMachineWard();
    const [settings] = useSubjectState(individuator.settings$);
    const theme = useTheme();
    const [media] = useSubjectState(theme.media$);

    const fraction = distanceFraction ?? placement?.distanceFraction;
    if (fraction === undefined || !geojson?.features.length || !geometry) {
        return null;
    }

    const hasTime = times !== null && Number.isFinite(times.startTimeEpoch) && Number.isFinite(times.duration);
    const position = hasTime
        ? getDistanceFractionPercent(fraction, geojson, geometry, times.startTimeEpoch, times.duration, controls.playbackPacing)
        : fraction * 100;
    const timeEpoch = hasTime
        ? times.startTimeEpoch + getRouteTimelinePositionForDistanceFraction(geojson, geometry, times.startTimeEpoch, fraction)
        : NaN;

    return {
        position,
        percentage: `${position.toFixed(0)}%`,
        distance: formatDistance(fraction * geometry.totalDistanceMeters, settings.distanceUnit, settings.locale),
        timestamp: Number.isFinite(timeEpoch) ? individuator.formatTimestamp(timeEpoch, settings, { short: media.isLessThanMd }) : null,
    };
};
