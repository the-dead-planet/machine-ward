import { GeoJson } from "@tinker-chest";
import { getSliderRanges, SliderRange } from "@ui";
import { PlaybackPacing } from "../../../animatrix";
import { RouteTimes } from "../../../model";
import { RouteGeometryData } from "../../../tinkers";

const clipSegment = (start: GeoJSON.Position, end: GeoJSON.Position, bounds: GeoJSON.BBox): SliderRange | null => {
    let entry = 0;
    let exit = 1;

    for (let axis = 0; axis < 2; axis++) {
        const delta = end[axis] - start[axis];

        if (delta === 0) {
            if (start[axis] < bounds[axis] || start[axis] > bounds[axis + 2]) {
                return null;
            }
        } else {
            const first = (bounds[axis] - start[axis]) / delta;
            const second = (bounds[axis + 2] - start[axis]) / delta;
            entry = Math.max(entry, Math.min(first, second));
            exit = Math.min(exit, Math.max(first, second));

            if (exit <= entry) {
                return null;
            }
        }
    }

    return {
        start: entry,
        end: exit,
    };
};

export const getVisibleRouteRanges = (geojson: GeoJson | undefined, geometry: RouteGeometryData | null, times: RouteTimes | null, bounds: GeoJSON.BBox | null, pacing: PlaybackPacing): SliderRange[] => {
    if (!geojson || !geometry || !times || !bounds || bounds.length !== 4 || !bounds.every(Number.isFinite) || bounds[3] < bounds[1]) {
        return [];
    }
    const maximum = pacing === "distance" ? geometry.totalDistanceMeters : times.duration;

    if (!Number.isFinite(maximum) || maximum <= 0) {
        return [];
    }

    const [west, south, suppliedEast, north] = bounds;
    const east = suppliedEast < west ? suppliedEast + 360 : suppliedEast;
    const center = (west + east) / 2;
    const ranges: SliderRange[] = [];

    for (let index = 1; index < geojson.features.length; index++) {
        const first = geojson.features[index - 1];
        const second = geojson.features[index];
        const start = first.geometry.coordinates;
        const end = second.geometry.coordinates;

        if (![start[0], start[1], end[0], end[1]].every(Number.isFinite)) {
            continue;
        }

        const startValue = pacing === "distance" ? geometry.lookup[index - 1]?.lineProgress * maximum : new Date(first.properties.time).valueOf() - times.startTimeEpoch;
        const endValue = pacing === "distance" ? geometry.lookup[index]?.lineProgress * maximum : new Date(second.properties.time).valueOf() - times.startTimeEpoch;

        const longitudeDelta = ((((end[0] - start[0] + 540) % 360) + 360) % 360) - 180;
        const shift = Math.round((center - start[0] - longitudeDelta / 2) / 360) * 360;

        for (const copy of east - west >= 360 ? [0] : [-360, 0, 360]) {
            const longitude = start[0] + shift + copy;
            const interval = clipSegment(
                [longitude, start[1]],
                [longitude + longitudeDelta, end[1]],
                [east - west >= 360 ? -Infinity : west, south, east - west >= 360 ? Infinity : east, north],
            );
            if (interval) {
                ranges.push({
                    start: startValue + (endValue - startValue) * interval.start,
                    end: startValue + (endValue - startValue) * interval.end,
                });
            }
        }
    }

    const visible = getSliderRanges(ranges, 0, maximum);

    if (visible.length === 1 && visible[0].start === 0 && visible[0].end === 1) {
        return [];
    }

    return visible.map(({ start, end }) => ({
        start: start * maximum,
        end: end * maximum,
    }));
};
