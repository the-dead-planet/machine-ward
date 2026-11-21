import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { useMultipleTranslations } from "@apparatus";
import { MobileMap } from "@mobile-apparatus";
import { ParsingResultWithError } from "@tinker-chest";
import { Animatrix } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { Icons, useTheme } from "@ui";
import { Button, Tooltip } from "@mobile-ui";
import { styles as sharedStyles } from "./slider-markers.styles";

const styles = StyleSheet.create({
    routeEndMarker: {
        right: 0,
        marginLeft: 0,
        marginRight: -20,
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
        <View pointerEvents="box-none" style={[sharedStyles.marker, styles.routeEndMarker]}>
            <View pointerEvents="none" style={sharedStyles.markerLine}>
                <View style={[sharedStyles.markerLineFill, { backgroundColor: color }]} />
            </View>
            <View pointerEvents="none" style={sharedStyles.markerHead}>
                <View style={[sharedStyles.markerHeadFill, { backgroundColor: color }]} />
            </View>
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
