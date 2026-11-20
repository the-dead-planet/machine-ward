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
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { useTheme } from "@ui";
import { Text } from "@mobile-ui";
import { styles as sharedStyles } from "./slider-markers.styles";

const styles = StyleSheet.create({
    markerBody: {
        flex: 1,
        width: 16,
        alignItems: "center",
    },
    dragging: {
        opacity: 0.5,
    },
    markerCount: {
        position: "absolute",
        left: 14,
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
}

export const SliderMarker: FC<Props> = ({ imageId, imageIds, gearId, translationKey }) => {
    const theme = useTheme();
    const [imageLabel] = useMultipleTranslations([{ n: gearId, t: translationKey.Image }]);
    const [selectedImageId] = useSubjectState(selectedImageId$);
    const [draggingImage] = useSubjectState(draggingImage$);
    const [highlightIdsBySourceId] = useSubjectState(highlightIdsBySourceId$);
    const selected = imageIds.includes(selectedImageId ?? -1);
    const isDragged = draggingImage?.id === imageId && draggingImage.interaction === "player";
    const highlighted = selected || isDragged || imageIds.some((id) => highlightIdsBySourceId.get(imageSourceIds.thumbnails)?.has(String(id)));
    const color = theme.color("tertiary", highlighted ? (theme.isDark ? 400 : 800) : 500);

    return (
        <View
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={imageIds.length > 1 ? `${imageIds.length} × ${imageLabel}: ${imageIds.join(", ")}` : `${imageLabel} ${imageId}`}
            onAccessibilityTap={() => toggleImageMarkerGroup(imageIds)}
            style={styles.markerBody}
        >
            <View style={[sharedStyles.markerLine, isDragged && styles.dragging, { backgroundColor: color }]} />
            <View style={[sharedStyles.markerHead, isDragged && styles.dragging, { backgroundColor: color }]} />
            {imageIds.length > 1 && (
                <Text accessible={false} fontWeight={highlighted ? 600 : 300} style={styles.markerCount}>
                    {formatImageMarkerCount(imageIds.length)}
                </Text>
            )}
        </View>
    );
};
