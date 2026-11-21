import { StyleSheet } from "react-native";
import { sliderMarkerSpecification } from "@the-dead-planet/nav-gauge-gears-route-story-common";

export const MARKER_HEIGHT = 44;
export const MARKER_ACTION_HEIGHT = 14;
export const MARKER_TOUCH_PADDING = 8;

export const styles = StyleSheet.create({
    marker: {
        position: "absolute",
        top: 0,
        width: 40,
        height: MARKER_ACTION_HEIGHT + MARKER_HEIGHT + MARKER_TOUCH_PADDING,
        paddingTop: MARKER_ACTION_HEIGHT,
        paddingBottom: MARKER_TOUCH_PADDING,
        marginLeft: -20,
        alignItems: "center",
    },
    markerHead: {
        width: sliderMarkerSpecification.diamondSize + sliderMarkerSpecification.borderWidth * 2,
        height: sliderMarkerSpecification.diamondSize + sliderMarkerSpecification.borderWidth * 2,
        marginTop: -sliderMarkerSpecification.diamondSize / 4 - sliderMarkerSpecification.borderWidth,
        marginBottom: -sliderMarkerSpecification.borderWidth,
        borderWidth: sliderMarkerSpecification.borderWidth,
        borderColor: "transparent",
        transform: [{ rotate: "45deg" }],
    },
    markerHeadFill: {
        width: sliderMarkerSpecification.diamondSize,
        height: sliderMarkerSpecification.diamondSize,
    },
    markerLine: {
        width: sliderMarkerSpecification.stickWidth + sliderMarkerSpecification.borderWidth * 2,
        marginBottom: 2,
        borderLeftWidth: sliderMarkerSpecification.borderWidth,
        borderRightWidth: sliderMarkerSpecification.borderWidth,
        borderColor: "transparent",
        flex: 1,
    },
    markerLineFill: {
        width: sliderMarkerSpecification.stickWidth,
        flex: 1,
    },
    panToButton: {
        position: "absolute",
        top: 2,
        width: 12,
        height: 12,
        minWidth: 12,
    },
});
