import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { MarkerImage, useMultipleTranslations } from "@apparatus";
import { MobileMap } from "@mobile-apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import {
    draggingImage$,
    highlightIdsBySourceId$,
    imageSourceIds,
    selectedImageId$,
    getRouteLngLatAtDistanceFraction,
    RouteGeometryData,
    RouteStoryTranslationKey,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { Icons } from "@ui";
import { Button, Tooltip } from "@mobile-ui";
import { MobileMarkerImageData } from "../../../images/image-parser";
import { SliderMarker } from "./SliderMarker";
import { styles as sharedStyles } from "./slider-markers.styles";
import { SliderMarkerGestureHandlers } from "./useSliderMarkerDrag";

const styles = StyleSheet.create({
    hiddenPanToButton: {
        display: "none",
    },
    unselected: {
        opacity: 0.45,
    },
});

interface Props {
    image: MarkerImage<MobileMarkerImageData>;
    imageIds: number[];
    percent: number;
    touchWidth: number;
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    map: MobileMap;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    drag: SliderMarkerGestureHandlers;
}

export const SliderMarkerGroup: FC<Props> = ({ image, imageIds, percent, touchWidth, gearId, translationKey, map, data$, routeGeometryData$, drag }) => {
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const [draggingImage] = useSubjectState(draggingImage$);
    const [label] = useMultipleTranslations([{ n: gearId, t: translationKey.PanToImage }]);
    const isDragged = draggingImage?.id === image.id && draggingImage.interaction === "player";
    const highlightImages = () => highlightIdsBySourceId$.next(new Map([[imageSourceIds.thumbnails, new Set(imageIds.map(String))]]));
    const clearHighlight = () => highlightIdsBySourceId$.next(new Map());

    const panToImage = () => {
        const { geojson } = data$.value;
        const geometry = routeGeometryData$.value;
        const coordinate = geojson && geometry ? getRouteLngLatAtDistanceFraction(geojson, geometry, image.distanceFraction!) : undefined;
        if (coordinate) {
            map.camera$.value?.easeTo({
                center: [coordinate.lng, coordinate.lat],
                duration: 300,
            });
        }
    };

    return (
        <View pointerEvents="box-none" style={[sharedStyles.marker, selectedImageId !== null && !imageIds.includes(selectedImageId) && styles.unselected, { left: `${percent}%` }]}>
            <Tooltip color="tertiary" content={label} placement="top" size="xs">
                <Button
                    icon={Icons.NounProject.Target}
                    size="xs"
                    color="tertiary"
                    accessibilityLabel={label}
                    onPress={panToImage}
                    onHoverIn={highlightImages}
                    onHoverOut={clearHighlight}
                    onFocus={highlightImages}
                    onBlur={clearHighlight}
                    onPressIn={highlightImages}
                    onPressOut={clearHighlight}
                    style={[sharedStyles.panToButton, isDragged && styles.hiddenPanToButton]}
                />
            </Tooltip>
            <SliderMarker
                imageId={image.id}
                imageIds={imageIds}
                percent={percent}
                touchWidth={touchWidth}
                gearId={gearId}
                translationKey={translationKey}
                drag={drag}
            />
        </View>
    );
};
