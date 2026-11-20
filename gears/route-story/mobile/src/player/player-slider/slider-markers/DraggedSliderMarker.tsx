import { FC } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { useMultipleTranslations } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { Animatrix, draggingImage$, RouteGeometryData, RouteStoryTranslationKey, RouteTimes, useSliderMarkerReadout } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { FontType, Icons, useTheme } from "@ui";
import { Button, Caption } from "@mobile-ui";
import { styles as sharedStyles } from "./slider-markers.styles";

const styles = StyleSheet.create({
    dragMarker: {
        opacity: 0.5,
    },
    readout: {
        position: "absolute",
        bottom: "100%",
        marginBottom: 12,
        alignItems: "center",
        width: 260,
    },
});

interface Props {
    position: Animated.Value;
    gearId: string;
    translationKey: typeof RouteStoryTranslationKey;
    data$: BehaviorSubject<ParsingResultWithError>;
    routeGeometryData$: BehaviorSubject<RouteGeometryData | null>;
    routeTimes$: BehaviorSubject<RouteTimes | null>;
    animatrix: Animatrix;
}

export const DraggedSliderMarker: FC<Props> = ({ position, gearId, translationKey, ...props }) => {
    const preview = useSliderMarkerReadout(props);
    const [draggingImage] = useSubjectState(draggingImage$);
    const [label] = useMultipleTranslations([{ n: gearId, t: translationKey.PanToImage }]);
    const theme = useTheme();
    const color = theme.color("tertiary", theme.isDark ? 400 : 800);
    
    if (draggingImage?.interaction !== "player" || !preview) {
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
            <View style={styles.readout}>
                <Caption fontType={FontType.Numeric} color="tertiary" tabular nowrap>
                    {preview.percentage} · {preview.distance}
                </Caption>
                {preview.timestamp ? (
                    <Caption fontType={FontType.Numeric} color="tertiary" tabular nowrap>
                        {preview.timestamp}
                    </Caption>
                ) : null}
            </View>
            <Button icon={Icons.NounProject.Target} size="xs" color="tertiary" accessibilityLabel={label} style={sharedStyles.panToButton} />
            <View style={[sharedStyles.markerLine, { backgroundColor: color }]} />
            <View style={[sharedStyles.markerHead, { backgroundColor: color }]} />
        </Animated.View>
    );
};
