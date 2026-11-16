import { RefObject } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";
import { useMultipleTranslations } from "@apparatus";
import { Button, Chip, Text } from "@mobile-ui";
import { FontType, Icons } from "@ui";
import { shiftImageGroup, ImageGroupPagination, RouteStoryTranslationKey } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { ImageGroupPagerDimensions } from "./model";

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
        textAlign: "center",
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
    pagination: ImageGroupPagination;
    gearId: string;
    dimensions: RefObject<ImageGroupPagerDimensions | null>;
}

export const ImageGroupPager = ({ pagination, gearId, dimensions }: Props) => {
    const [previousLabel, nextLabel] = useMultipleTranslations([
        { n: gearId, t: RouteStoryTranslationKey.PreviousImages },
        { n: gearId, t: RouteStoryTranslationKey.NextImages },
    ]);
    return (
        <Marker
            id="route-story-image-group-pager"
            lngLat={pagination.lngLat}
            anchor="center"
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
                    >
                        <Text
                            style={styles.counter}
                            fontType={FontType.Numeric}
                            variant="fill"
                            color="tertiary"
                            numberOfLines={1}
                        >
                            +{pagination.hiddenCount}
                        </Text>
                    </Chip>
                </View>
                <View style={styles.controls}>
                    <Button
                        style={styles.previous}
                        icon={Icons.NounProject.Previous}
                        size="md"
                        variant="fill-translucent"
                        color="tertiary"
                        accessibilityLabel={previousLabel}
                        onPress={() => shiftImageGroup(pagination, -1)}
                    />
                    <Button
                        style={styles.next}
                        icon={Icons.NounProject.Next}
                        size="md"
                        variant="fill-translucent"
                        color="tertiary"
                        accessibilityLabel={nextLabel}
                        onPress={() => shiftImageGroup(pagination, 1)}
                    />
                </View>
            </View>
        </Marker>
    );
};
