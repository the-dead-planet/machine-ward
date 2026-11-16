import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Map, Marker } from "maplibre-gl";
import classNames from "classnames";
import { useMultipleTranslations } from "@apparatus";
import { Button, Chip } from "@web-ui";
import { FontType, Icons } from "@ui";
import { shiftImageGroup, ImageGroupPagination, RouteStoryTranslationKey } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import styles from "./image-group-pager.module.css";

interface Props {
    map: Map;
    pagination: ImageGroupPagination;
    gearId: string;
}

const usePagerMarker = (map: Map, lngLat: [number, number]) => {
    const [element] = useState(() => document.createElement("div"));
    const [marker] = useState(
        () =>
            new Marker({
                element,
                anchor: "center",
                pitchAlignment: "viewport",
                rotationAlignment: "viewport",
            }),
    );
    useEffect(() => {
        marker.setLngLat(lngLat).addTo(map);
        return () => {
            marker.remove();
        };
    }, [map, marker]);

    useEffect(() => {
        marker.setLngLat(lngLat);
    }, [marker, lngLat]);

    return element;
};

export const ImageGroupPager = ({ map, pagination, gearId }: Props) => {
    const element = usePagerMarker(map, pagination.lngLat);
    const [previousLabel, nextLabel] = useMultipleTranslations([
        { n: gearId, t: RouteStoryTranslationKey.PreviousImages },
        { n: gearId, t: RouteStoryTranslationKey.NextImages },
    ]);

    return createPortal(
        <section
            className={styles.pager}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
            onTouchEnd={(event) => event.stopPropagation()}
        >
            <div role="status" aria-live="polite" className={styles.count}>
                <Chip
                    color="tertiary"
                    variant="fill"
                    fontType={FontType.Numeric}
                    className={styles.counter}
                >
                    +{pagination.hiddenCount}
                </Chip>
            </div>
            <div className={styles.controls}>
                <Button
                    icon={Icons.NounProject.Previous}
                    size="md"
                    variant="fill-translucent"
                    color="tertiary"
                    aria-label={previousLabel}
                    onClick={() => shiftImageGroup(pagination, -1)}
                    className={classNames(styles.arrow, styles.left)}
                />
                <Button
                    icon={Icons.NounProject.Next}
                    size="md"
                    variant="fill-translucent"
                    color="tertiary"
                    aria-label={nextLabel}
                    onClick={() => shiftImageGroup(pagination, 1)}
                    className={classNames(styles.arrow, styles.right)}
                />
            </div>
        </section>,
        element,
    );
};
