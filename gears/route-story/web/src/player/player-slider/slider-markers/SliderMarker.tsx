import { FC, ReactNode, useState } from "react";
import classNames from "classnames";
import { useMultipleTranslations } from "@apparatus";
import { useSubjectState } from "@tinker-chest";
import {
    draggingImage$,
    highlightIdsBySourceId$,
    imageSourceIds,
    selectedImageId$,
    toggleImageMarkerGroup,
    formatImageMarkerCount,
    RouteStoryTranslationKey,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { Span } from "@web-ui";
import { useSliderMarkerDrag } from "./useSliderMarkerDrag";
import styles from "./slider-markers.module.css";

interface Props {
    imageId: number;
    imageIds: number[];
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    drag: ReturnType<typeof useSliderMarkerDrag>;
    readout: ReactNode;
}

export const SliderMarker: FC<Props> = (props) => {
    const { imageId, imageIds, gearId, translationKey, drag, readout } = props;
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [imageLabel] = useMultipleTranslations([{ n: gearId, t: translationKey.Image }]);
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const [draggingImage] = useSubjectState(draggingImage$);
    const [highlightIdsBySourceId] = useSubjectState(highlightIdsBySourceId$);
    const { beginDrag, didDrag, endDrag } = drag;
    const selected = imageIds.includes(selectedImageId ?? -1);
    const highlighted =
        hovered || focused || selected || (draggingImage?.id !== imageId && imageIds.some((id) => highlightIdsBySourceId.get(imageSourceIds.thumbnails)?.has(String(id))));

    return (
        <>
            {(selected || hovered || focused) && draggingImage === null ? readout : null}
            <span
                role="button"
                tabIndex={0}
                data-keysmith-target
                draggable={false}
                aria-label={imageIds.length > 1 ? `${imageIds.length} × ${imageLabel}: ${imageIds.join(", ")}` : `${imageLabel} ${imageId}`}
                aria-pressed={selected}
                onClick={(event) => {
                    if (!didDrag.current) {
                        endDrag();
                        toggleImageMarkerGroup(imageIds);
                        if (selected && event.detail > 0) {
                            event.currentTarget.blur();
                        }
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleImageMarkerGroup(imageIds);
                    }
                }}
                onMouseEnter={() => {
                    setHovered(true);
                    highlightIdsBySourceId$.next(new Map([[imageSourceIds.thumbnails, new Set(imageIds.map(String))]]));
                }}
                onMouseLeave={() => {
                    setHovered(false);
                    highlightIdsBySourceId$.next(new Map());
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.focus();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    beginDrag(imageId, event.clientX);
                }}
                className={classNames(styles["image-marker"], {
                    [styles["dragging"]]: draggingImage?.id === imageId,
                    [styles["highlight"]]: highlighted,
                })}
            >
                {imageIds.length > 1 && (
                    <Span aria-hidden="true" fontWeight={highlighted ? 600 : 300} className={styles["marker-count"]}>
                        {formatImageMarkerCount(imageIds.length)}
                    </Span>
                )}
            </span>
        </>
    );
};
