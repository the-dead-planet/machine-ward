import { FC } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import {
    DEFAULT_COLOR,
    getSliderRanges,
    SLIDER_RANGE_EXTRA_THICKNESS,
    SliderProps,
    sliderRangeShades,
    useTheme,
} from "@ui";

const styles = StyleSheet.create({
    range: {
        position: "absolute",
        top: -SLIDER_RANGE_EXTRA_THICKNESS / 2,
    },
});

type Props = Pick<SliderProps, "ranges" | "color" | "min" | "max"> & {
    width: number;
    trackThickness: number;
};

export const SliderRangeTrack: FC<Props> = ({
    ranges = [],
    color = DEFAULT_COLOR,
    min = 0,
    max = 100,
    width,
    trackThickness,
}) => {
    const theme = useTheme();
    const paint = theme.color(color, sliderRangeShades[theme.mode]);
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
                        fill={paint}
                    />
                </Svg>
            </View>
        );
    });
};
