import { FC } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import {
    getSliderRanges,
    SLIDER_RANGE_EXTRA_THICKNESS,
    SliderProps,
    useTheme,
} from "@ui";

const styles = StyleSheet.create({
    range: {
        position: "absolute",
        top: -SLIDER_RANGE_EXTRA_THICKNESS / 2,
    },
});

type Props = Pick<SliderProps, "ranges" | "rangeColor" | "min" | "max"> & {
    width: number;
    trackThickness: number;
};

export const SliderRangeTrack: FC<Props> = ({
    ranges = [],
    rangeColor,
    min = 0,
    max = 100,
    width,
    trackThickness,
}) => {
    const theme = useTheme();
    const color = theme.resolveAppearance("ghost", rangeColor).glyphs;
    const thickness = trackThickness + SLIDER_RANGE_EXTRA_THICKNESS;

    if (width <= 0) {
        return null;
    }

    return getSliderRanges(ranges, min, max).map(({ start, end }) => {
        const rangeWidth = (end - start) * width;
        const cap = Math.min(thickness / 2, rangeWidth / 2);
        return (
            <View
                key={start}
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.range, { left: start * width }]}
            >
                <Svg width={rangeWidth} height={thickness}>
                    <Polygon
                        testID="slider-range-track"
                        points={`0,${thickness / 2} ${cap},0 ${rangeWidth - cap},0 ${rangeWidth},${thickness / 2} ${rangeWidth - cap},${thickness} ${cap},${thickness}`}
                        fill={color}
                    />
                </Svg>
            </View>
        );
    });
};
