import type * as maplibregl from "maplibre-gl";
import { FC } from "react";
import { BehaviorSubject } from "rxjs";
import classNames from "classnames";
import { useMultipleTranslations } from "@apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import { Animatrix } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { Button, Tooltip } from "@web-ui";
import { Icons } from "@ui";
import styles from "./slider-markers.module.css";

interface Props {
    map: maplibregl.Map;
    data$: BehaviorSubject<ParsingResultWithError>;
    fitBoundsHandler: (map: maplibregl.Map, boundingBox?: GeoJSON.BBox) => void;
    animatrix: Animatrix;
}

export const SliderMarkerPanToWholeRoute: FC<Props> = ({
    map,
    data$,
    fitBoundsHandler,
    animatrix,
}) => {
    const [
        panToWholeRouteAtEndLabel,
    ] = useMultipleTranslations([
        { n: animatrix.namespace, t: animatrix.translationKey.PanToWholeRouteAtEnd },
    ]);

    return (
        <div className={styles["route-end-marker-container"]}>
            <span
                role="presentation"
                className={classNames(styles["image-marker"], styles["route-end-marker"])}
            />
            <Tooltip
                content={panToWholeRouteAtEndLabel}
                placement="top"
                size="xs"
            >
                <Button
                    icon={Icons.NounProject.Target}
                    size="xs"
                    aria-label={panToWholeRouteAtEndLabel}
                    onClick={(event) => {
                        event.stopPropagation();
                        fitBoundsHandler(map, data$.value.boundingBox);
                    }}
                    className={styles["pan-to-icon"]}
                />
            </Tooltip>
        </div>
    );
};
