import { RefObject } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";
import { useMultipleTranslations } from "@apparatus";
import { Button, Chip } from "@mobile-ui";
import { FontType, Icons } from "@ui";
import { ImageMarkerOperator, ImageGroupPagination, RouteStoryTranslationKey } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { ImageGroupPagerDimensions } from "./model";
import { useImageGroupPagerInteraction } from "./useImageGroupPagerInteraction";

const styles = StyleSheet.create({
    pager: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
    },
    controls: {
        flexDirection: "row",
        gap: 1,
    },
    counter: {
        fontSize: 14,
    },
    previous: {
        borderTopLeftRadius: "50%",
        borderBottomLeftRadius: "50%",
    },
    next: {
        borderTopRightRadius: "50%",
        borderBottomRightRadius: "50%",
    },
});

interface Props {
    imageMarkerOperator: ImageMarkerOperator;
    pagination: ImageGroupPagination;
    gearId: string;
    dimensions: RefObject<ImageGroupPagerDimensions | null>;
    position: RefObject<[number, number] | null>;
}

export const ImageGroupPager = ({ pagination, gearId, dimensions, position, imageMarkerOperator }: Props) => {
    const { shiftImageGroup } = imageMarkerOperator;
    const { onControlsLayout, onPress } = useImageGroupPagerInteraction(pagination, position, dimensions, shiftImageGroup);
    const [previousLabel, nextLabel] = useMultipleTranslations([
        { n: gearId, t: RouteStoryTranslationKey.PreviousImages },
        { n: gearId, t: RouteStoryTranslationKey.NextImages },
    ]);
    return (
        <Marker
            id="route-story-image-group-pager"
            lngLat={pagination.lngLat}
            anchor="center"
            onPress={onPress}
        >
            <View
                style={styles.pager}
                onLayout={({ nativeEvent: { layout } }) => {
                    dimensions.current = layout;
                }}
                onTouchStart={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
            >
                <View pointerEvents="none" accessibilityLiveRegion="polite">
                    <Chip
                        color="tertiary"
                        variant="fill"
                        fontType={FontType.Numeric}
                        textStyle={styles.counter}
                    >
                        +{pagination.hiddenCount}
                    </Chip>
                </View>
                <View style={styles.controls} onLayout={onControlsLayout}>
                    <Button
                        style={styles.previous}
                        icon={Icons.NounProject.Previous}
                        size="md"
                        variant="fill-translucent"
                        color="tertiary"
                        accessibilityLabel={previousLabel}
                        onPress={(event) => {
                            event.stopPropagation();
                            shiftImageGroup(pagination, -1);
                        }}
                    />
                    <Button
                        style={styles.next}
                        icon={Icons.NounProject.Next}
                        size="md"
                        variant="fill-translucent"
                        color="tertiary"
                        accessibilityLabel={nextLabel}
                        onPress={(event) => {
                            event.stopPropagation();
                            shiftImageGroup(pagination, 1);
                        }}
                    />
                </View>
            </View>
        </Marker>
    );
};
