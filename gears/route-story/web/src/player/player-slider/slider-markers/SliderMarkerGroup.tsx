import type * as maplibregl from "maplibre-gl";
import { FC } from "react";
import { BehaviorSubject } from "rxjs";
import classNames from "classnames";
import { MarkerImage, useMultipleTranslations } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import {
    RouteGeometryData,
    Animatrix,
    RouteTimes,
    RouteStoryTranslationKey,
    draggingImage$,
    draggingPlacement$,
    highlightIdsBySourceId$,
    imageSourceIds,
    ImageMarkerOperator,
    getRouteLngLatAtDistanceFraction,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { Icons } from "@ui";
import { Button, Tooltip } from "@web-ui";
import { WebMarkerImageData } from "../../../images/image-parser";
import { SliderMarker } from "./SliderMarker";
import { SliderMarkerHoverReadout } from "./SliderMarkerReadout";
import { useSliderMarkerDrag } from "./useSliderMarkerDrag";
import styles from "./slider-markers.module.css";

interface Props {
    imageMarkerOperator: ImageMarkerOperator;
    image: MarkerImage<WebMarkerImageData>;
    imageIds: number[];
    percent: number;
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    map: maplibregl.Map;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    animatrix: Animatrix;
    drag: ReturnType<typeof useSliderMarkerDrag>;
    fitBoundsHandler: (map: maplibregl.Map, boundingBox?: GeoJSON.BBox) => void;
}

export const SliderMarkerGroup: FC<Props> = (props) => {
    const { image, imageIds, percent, gearId, translationKey, map, data$, routeGeometryData$, routeTimes$, fitBoundsHandler } = props;
    const [selectedImageId] = useSubjectState(props.imageMarkerOperator.selectedImageId$);
    const [draggingImage] = useSubjectState(draggingImage$);
    const [draggingPlacement] = useSubjectState(draggingPlacement$);
    const [label] = useMultipleTranslations([{ n: gearId, t: translationKey.PanToImage }]);
    const highlightImages = () => highlightIdsBySourceId$.next(new Map([[imageSourceIds.thumbnails, new Set(imageIds.map(String))]]));
    const clearHighlight = () => highlightIdsBySourceId$.next(new Map());

    return (
        <div
            className={classNames(styles["image-marker-container"], {
                [styles["unselected"]]: selectedImageId !== null && !imageIds.includes(selectedImageId),
            })}
            style={{ left: `${percent}%` }}
        >
            <Tooltip color="tertiary" content={label} placement="top" size="xs">
                <Button
                    icon={Icons.NounProject.Target}
                    size="xs"
                    color="tertiary"
                    aria-label={label}
                    onMouseEnter={highlightImages}
                    onMouseLeave={clearHighlight}
                    onFocus={highlightImages}
                    onBlur={clearHighlight}
                    onClick={(event) => {
                        event.stopPropagation();
                        const { geojson } = data$.value;
                        const geometry = routeGeometryData$.value;
                        const coordinate = geojson && geometry ? getRouteLngLatAtDistanceFraction(geojson, geometry, image.distanceFraction!) : undefined;
                        if (coordinate) {
                            fitBoundsHandler(map, [coordinate.lng, coordinate.lat, coordinate.lng, coordinate.lat]);
                        }
                    }}
                    className={classNames(styles["pan-to-icon"], {
                        [styles["pan-to-icon-hidden"]]:
                            draggingImage?.id === image.id && draggingPlacement !== null && !!data$.value.geojson && routeGeometryData$.value !== null && routeTimes$.value !== null,
                    })}
                />
            </Tooltip>
            <SliderMarker
                imageMarkerOperator={props.imageMarkerOperator}
                imageId={image.id}
                imageIds={imageIds}
                gearId={gearId}
                translationKey={translationKey}
                drag={props.drag}
                readout={<SliderMarkerHoverReadout {...props} distanceFraction={image.distanceFraction} />}
            />
        </div>
    );
};
