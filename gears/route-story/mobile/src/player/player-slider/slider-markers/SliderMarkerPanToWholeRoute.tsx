import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { useMultipleTranslations } from "@apparatus";
import { MobileMap } from "@mobile-apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import { Animatrix } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { Icons, useTheme } from "@ui";
import { Button, Tooltip } from "@mobile-ui";
import { MARKER_ACTION_HEIGHT, MARKER_HEIGHT, styles as sharedStyles } from "./slider-markers.styles";

const styles = StyleSheet.create({
    routeEndMarker: {
        position: "absolute",
        right: 0,
        top: MARKER_ACTION_HEIGHT,
        width: 16,
        height: MARKER_HEIGHT,
        marginRight: -8,
        alignItems: "center",
    },
});

interface Props {
    map: MobileMap;
    data$: BehaviorSubject<ParsingResultWithError>;
    fitBoundsHandler: (map: MobileMap, boundingBox?: GeoJSON.BBox) => void;
    animatrix: Animatrix;
}

export const SliderMarkerPanToWholeRoute: FC<Props> = ({ map, data$, fitBoundsHandler, animatrix }) => {
    const theme = useTheme();
    const color = theme.color("neutral", 500);
    const [label] = useMultipleTranslations([{ n: animatrix.namespace, t: animatrix.translationKey.PanToWholeRouteAtEnd }]);

    return (
        <View style={styles.routeEndMarker}>
            <View style={[sharedStyles.markerLine, { backgroundColor: color }]} />
            <View style={[sharedStyles.markerHead, { backgroundColor: color }]} />
            <Tooltip content={label} placement="top" size="xs">
                <Button
                    icon={Icons.NounProject.Target}
                    size="xs"
                    accessibilityLabel={label}
                    onPress={() => fitBoundsHandler(map, data$.value.boundingBox)}
                    style={sharedStyles.panToButton}
                />
            </Tooltip>
        </View>
    );
};
