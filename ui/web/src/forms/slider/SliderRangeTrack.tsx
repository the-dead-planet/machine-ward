import { CSSProperties, FC } from "react";
import { getSliderRanges, SliderProps, useTheme } from "@ui";
import styles from "./slider.module.css";

type Props = Pick<SliderProps, "ranges" | "rangeColor" | "min" | "max">;

export const SliderRangeTrack: FC<Props> = ({
    ranges = [],
    rangeColor,
    min = 0,
    max = 100,
}) => {
    const theme = useTheme();
    const color = theme.resolveAppearance("ghost", rangeColor).glyphs;

    return getSliderRanges(ranges, min, max).map(({ start, end }) => (
        <div
            key={start}
            aria-hidden="true"
            className={styles["range-track"]}
            style={
                {
                    "--range-start": `${start * 100}%`,
                    "--range-width": `${(end - start) * 100}%`,
                    "--range-color": color,
                } as CSSProperties
            }
        />
    ));
};
