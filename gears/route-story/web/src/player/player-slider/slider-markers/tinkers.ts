import { GeoJson } from "@tinker-chest";
import {
    getDistanceFractionPercent,
    getRoutePlacementAtPercent,
    getPlayerSliderStep,
    PlaybackPacing,
    RouteGeometryData,
    RouteTimes,
} from "@the-dead-planet/machine-ward-gears-route-story-common";

export const getSliderStepDistanceFraction = (
    distanceFraction: number,
    direction: -1 | 1,
    geojson: GeoJson | undefined,
    routeTimes: RouteTimes | null,
    routeGeometryData: RouteGeometryData | null,
    playbackPacing: PlaybackPacing,
    step: "slider" | "percent",
): number | null => {
    if (!geojson || !routeTimes || !routeGeometryData) {
        return null;
    }
    const sliderMax = playbackPacing === "distance" ? Math.max(routeGeometryData.totalDistanceMeters, 1) : routeTimes.duration;

    if (sliderMax <= 0) {
        return null;
    }
    
    const percent = getDistanceFractionPercent(distanceFraction, geojson, routeGeometryData, routeTimes.startTimeEpoch, routeTimes.duration, playbackPacing);
    const stepSize = getPlayerSliderStep(playbackPacing);
    const delta = step === "percent" ? 1 : stepSize * 100 / sliderMax;
    const nextPercent = Math.min(Math.max(percent + direction * delta, 0), 100);

    return getRoutePlacementAtPercent(nextPercent, geojson, routeTimes, routeGeometryData, playbackPacing)?.distanceFraction ?? null;
};
