import { FC } from "react";
import { StyleSheet, View } from "react-native";
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
    sliderMarkerSpecification,
} from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useTheme } from "@ui";
import { Text } from "@mobile-ui";
import { MARKER_TOUCH_PADDING, styles as sharedStyles } from "./slider-markers.styles";
import { SliderMarkerGestureHandlers } from "./useSliderMarkerDrag";

const styles = StyleSheet.create({
    markerBody: {
        flex: 1,
        alignItems: "center",
    },
    dragging: {
        opacity: 0.5,
    },
    markerCount: {
        position: "absolute",
        left: "50%",
        marginLeft: 6,
        bottom: -7,
        fontSize: 8,
        lineHeight: 10,
    },
});

interface Props {
    imageId: number;
    imageIds: number[];
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    percent: number;
    touchWidth: number;
    drag: SliderMarkerGestureHandlers;
}

export const SliderMarker: FC<Props> = ({ imageId, imageIds, gearId, translationKey, percent, touchWidth, drag }) => {
    const theme = useTheme();
    const [imageLabel] = useMultipleTranslations([{ n: gearId, t: translationKey.Image }]);
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const [draggingImage] = useSubjectState(draggingImage$);
    const [highlightIdsBySourceId] = useSubjectState(highlightIdsBySourceId$);
    const selected = imageIds.includes(selectedImageId ?? -1);
    const isDragged = draggingImage?.id === imageId && draggingImage.interaction === "player";
    const highlighted = selected || isDragged || imageIds.some((id) => highlightIdsBySourceId.get(imageSourceIds.thumbnails)?.has(String(id)));
    const specification = sliderMarkerSpecification;
    const color = theme.color(specification.color, highlighted ? specification.highlightedShade : specification.defaultShade);
    const borderColor = highlighted ? theme.color(specification.color, specification.borderShade) : "transparent";

    return (
        <View
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={imageIds.length > 1 ? `${imageIds.length} × ${imageLabel}: ${imageIds.join(", ")}` : `${imageLabel} ${imageId}`}
            onAccessibilityTap={() => toggleImageMarkerGroup(imageIds)}
            onStartShouldSetResponder={(event) => drag.beginDrag(imageId, imageIds, percent, event.nativeEvent.pageX)}
            onResponderGrant={drag.grantDrag}
            onResponderMove={(event) => drag.moveDrag(event.nativeEvent.pageX)}
            onResponderRelease={() => drag.endDrag()}
            onResponderTerminate={() => drag.endDrag(true)}
            onResponderReject={() => drag.endDrag(true)}
            hitSlop={{ bottom: MARKER_TOUCH_PADDING }}
            style={[styles.markerBody, { width: touchWidth }]}
        >
            <View pointerEvents="none" style={[sharedStyles.markerLine, isDragged && styles.dragging, { borderColor }]}>
                <View style={[sharedStyles.markerLineFill, { backgroundColor: color }]} />
            </View>
            <View pointerEvents="none" style={[sharedStyles.markerHead, isDragged && styles.dragging, { borderColor }]}>
                <View style={[sharedStyles.markerHeadFill, { backgroundColor: color }]} />
            </View>
            {imageIds.length > 1 && (
                <Text accessible={false} pointerEvents="none" fontWeight={highlighted ? 600 : 300} style={styles.markerCount}>
                    {formatImageMarkerCount(imageIds.length)}
                </Text>
            )}
        </View>
    );
};
