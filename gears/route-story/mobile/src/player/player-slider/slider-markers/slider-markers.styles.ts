import { StyleSheet } from "react-native";

export const MARKER_HEIGHT = 44;
export const MARKER_ACTION_HEIGHT = 14;

export const styles = StyleSheet.create({
    marker: {
        position: "absolute",
        top: MARKER_ACTION_HEIGHT,
        width: 16,
        height: MARKER_HEIGHT,
        marginLeft: -8,
        alignItems: "center",
    },
    markerHead: {
        width: 8,
        height: 8,
        marginTop: -2,
        transform: [{ rotate: "45deg" }],
    },
    markerLine: {
        width: 2,
        flex: 1,
    },
    panToButton: {
        position: "absolute",
        top: -MARKER_ACTION_HEIGHT + 2,
        width: 12,
        height: 12,
        minWidth: 12,
    },
});
