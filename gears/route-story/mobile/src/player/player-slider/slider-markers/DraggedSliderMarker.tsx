import { FC } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { useMultipleTranslations } from "@apparatus";
import { ParsingResultWithError, useSubjectState } from "@tinker-chest";
import { Animatrix, draggingImage$, RouteGeometryData, RouteStoryTranslationKey, RouteTimes, sliderMarkerSpecification, useSliderMarkerReadout } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { FontType, Icons, useTheme } from "@ui";
import { Button, Caption } from "@mobile-ui";
import { styles as sharedStyles } from "./slider-markers.styles";

const styles = StyleSheet.create({
    readout: {
        position: "absolute",
        top: sharedStyles.panToButton.top + 2,
        transform: [{ translateY: "-100%" }],
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
    const specification = sliderMarkerSpecification;
    const color = theme.color(specification.color, specification.highlightedShade);
    const borderColor = theme.color(specification.color, specification.borderShade);
    
    if (draggingImage === null || !preview) {
        return null;
    }

    return (
        <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
                sharedStyles.marker,
                {
                    left: draggingImage.interaction === "map"
                        ? `${preview.position}%`
                        : position.interpolate({
                            inputRange: [0, 100],
                            outputRange: ["0%", "100%"],
                        }),
                },
            ]}
        >
            <View style={styles.readout}>
                <Caption fontType={FontType.Numeric} color="tertiary" tabular nowrap>
                    {[preview.percentage, preview.distance, preview.timestamp].filter(Boolean).join(" · ")}
                </Caption>
            </View>
            <Button icon={Icons.NounProject.Target} size="xs" color="tertiary" accessibilityLabel={label} style={sharedStyles.panToButton} />
            <View style={[sharedStyles.markerLine, { borderColor }]}>
                <View style={[sharedStyles.markerLineFill, { backgroundColor: color }]} />
            </View>
            <View style={[sharedStyles.markerHead, { borderColor }]}>
                <View style={[sharedStyles.markerHeadFill, { backgroundColor: color }]} />
            </View>
        </Animated.View>
    );
};
