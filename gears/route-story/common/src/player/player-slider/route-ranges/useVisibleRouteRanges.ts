import { useEffect, useState } from "react";
import { BehaviorSubject, combineLatest, map } from "rxjs";
import { useMachineWard } from "@apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import { SliderRange } from "@ui";
import { Animatrix } from "../../../animatrix";
import { RouteTimes } from "../../../model";
import { RouteGeometryData } from "../../../tinkers";
import { getVisibleRouteRanges } from "./tinkers";

export interface VisibleRouteRangesProps {
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    animatrix: Animatrix;
    enabled: boolean;
}

export const useVisibleRouteRanges = ({
    data$,
    routeGeometryData$,
    routeTimes$,
    animatrix,
    enabled,
}: VisibleRouteRangesProps): SliderRange[] => {
    const { cartomancer } = useMachineWard();
    const [ranges, setRanges] = useState<SliderRange[]>([]);

    useEffect(() => {
        if (!enabled) {
            return;
        }
        const subscription = combineLatest([cartomancer.bounds$, data$, routeGeometryData$, routeTimes$, animatrix.controls$])
            .pipe(map(([bounds, { geojson }, geometry, times, controls]) => getVisibleRouteRanges(geojson, geometry, times, bounds, controls.playbackPacing)))
            .subscribe(setRanges);

        return () => subscription.unsubscribe();
    }, [cartomancer, data$, routeGeometryData$, routeTimes$, animatrix, enabled]);

    return enabled ? ranges : [];
};
