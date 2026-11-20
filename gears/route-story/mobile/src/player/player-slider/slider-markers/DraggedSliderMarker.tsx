import { FC } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useMultipleTranslations } from "@apparatus";
import { useSubjectState } from "@tinker-chest";
import { draggingImage$, RouteStoryTranslationKey } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { Icons, useTheme } from "@ui";
import { Button } from "@mobile-ui";
import { styles as sharedStyles } from "./slider-markers.styles";

const styles = StyleSheet.create({
    dragMarker: {
        opacity: 0.5,
    },
});

interface Props {
    position: Animated.Value;
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
}

export const DraggedSliderMarker: FC<Props> = ({ position, gearId, translationKey }) => {
    const [draggingImage] = useSubjectState(draggingImage$);
    const [label] = useMultipleTranslations([{ n: gearId, t: translationKey.PanToImage }]);
    const theme = useTheme();
    const color = theme.color("tertiary", theme.isDark ? 400 : 800);
    
    if (draggingImage?.interaction !== "player") {
        return null;
    }

    return (
        <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
                sharedStyles.marker,
                styles.dragMarker,
                {
                    left: position.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                    }),
                },
            ]}
        >
            <Button icon={Icons.NounProject.Target} size="xs" color="tertiary" accessibilityLabel={label} style={sharedStyles.panToButton} />
            <View style={[sharedStyles.markerLine, { backgroundColor: color }]} />
            <View style={[sharedStyles.markerHead, { backgroundColor: color }]} />
        </Animated.View>
    );
};
