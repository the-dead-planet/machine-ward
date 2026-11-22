import { CSSProperties, FC } from "react";
import { DEFAULT_COLOR, getSliderRanges, sliderRangeShades, SliderProps, useTheme } from "@ui";
import styles from "./slider.module.css";

type Props = Pick<SliderProps, "ranges" | "color" | "min" | "max">;

export const SliderRangeTrack: FC<Props> = ({
    ranges = [],
    color = DEFAULT_COLOR,
    min = 0,
    max = 100,
}) => {
    const theme = useTheme();
    const paint = theme.color(color, sliderRangeShades[theme.mode]);

    return getSliderRanges(ranges, min, max).map(({ start, end }) => (
        <div
            key={start}
            aria-hidden="true"
            className={styles["range-track"]}
            style={
                {
                    "--range-start": `${start * 100}%`,
                    "--range-width": `${(end - start) * 100}%`,
                    "--range-color": paint,
                } as CSSProperties
            }
        />
    ));
};
