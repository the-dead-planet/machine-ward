import { FC } from "react";
import { BehaviorSubject } from "rxjs";
import classNames from "classnames";
import { useMultipleTranslations } from "@apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import {
    Animatrix,
    RouteGeometryData,
    RouteTimes,
    RouteStoryTranslationKey,
    useSliderMarkerReadout,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { Icons } from "@ui";
import { Button } from "@web-ui";
import { SliderMarkerReadout } from "./SliderMarkerReadout";
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
    const preview = useSliderMarkerReadout({ data$, routeGeometryData$, routeTimes$, animatrix });
    const [label] = useMultipleTranslations([{ n: gearId, t: translationKey.PanToImage }]);

    if (!preview) {
        return null;
    }

    return (
        <div aria-hidden="true" inert className={classNames(styles["image-marker-container"], styles["drag-marker"])} style={{ left: `${preview.position.toFixed(4)}%` }}>
            <SliderMarkerReadout preview={preview} />
            <Button icon={Icons.NounProject.Target} size="xs" color="tertiary" aria-label={label} tabIndex={-1} className={styles["pan-to-icon"]} />
            <span className={classNames(styles["image-marker"], styles["drag-marker"], styles["highlight"])} />
        </div>
    );
};
