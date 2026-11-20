import { FC } from "react";
import { BehaviorSubject } from "rxjs";
import classNames from "classnames";
import { useMultipleTranslations } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import {
    Animatrix,
    RouteGeometryData,
    RouteTimes,
    RouteStoryTranslationKey,
    draggingPlacement$,
    getDistanceFractionPercent,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { Icons } from "@ui";
import { Button } from "@web-ui";
import styles from "./slider-markers.module.css";

interface Props {
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    animatrix: Animatrix;
}

export const DraggedSliderMarker: FC<Props> = ({ gearId, translationKey, data$, routeGeometryData$, routeTimes$, animatrix }) => {
    const [placement] = useSubjectState(draggingPlacement$);
    const [{ geojson }] = useSubjectState(data$);
    const [geometry] = useSubjectState(routeGeometryData$);
    const [times] = useSubjectState(routeTimes$);
    const [controls] = useSubjectState(animatrix.controls$);
    const [label] = useMultipleTranslations([{ n: gearId, t: translationKey.PanToImage }]);

    if (placement === null || !geojson || !geometry || !times) {
        return null;
    }

    const position = getDistanceFractionPercent(placement.distanceFraction, geojson, geometry, times.startTimeEpoch, times.duration, controls.playbackPacing);

    return (
        <div aria-hidden="true" inert className={classNames(styles["image-marker-container"], styles["drag-marker"])} style={{ left: `${position.toFixed(4)}%` }}>
            <Button icon={Icons.NounProject.Target} size="xs" color="tertiary" aria-label={label} tabIndex={-1} className={styles["pan-to-icon"]} />
            <span className={classNames(styles["image-marker"], styles["drag-marker"], styles["highlight"])} />
        </div>
    );
};
