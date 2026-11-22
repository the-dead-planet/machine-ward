import { ComponentProps, CSSProperties, FC } from "react";
import classNames from "classnames";
import { DEFAULT_COLOR, getSliderRatio, SLIDER_RANGE_EXTRA_THICKNESS, SliderProps } from "@ui";
import styles from "./slider.module.css";
import { SliderRangeTrack } from "./SliderRangeTrack";

type Props = Pick<
    SliderProps,
    "value" | "onChange" | "min" | "max" | "step" | "ariaLabel" | "ranges" | "color"
> &
    Omit<ComponentProps<"input">, "onChange" | "size">;

export const SliderTrack: FC<Props> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    ariaLabel,
    ranges,
    color = DEFAULT_COLOR,
    className,
    ...props
}) => (
    <div
        className={styles["slider-wrapper"]}
        style={
            {
                "--track-complete": `${getSliderRatio(value, min, max) * 100}%`,
                "--range-extra-thickness": `${SLIDER_RANGE_EXTRA_THICKNESS}px`,
            } as CSSProperties
        }
    >
        <div className={styles.track} aria-hidden="true">
            <div className={styles.progress} />
            <div className={styles.thumb} />
        </div>
        <div className={styles["range-tracks"]}>
            <SliderRangeTrack ranges={ranges} color={color} min={min} max={max} />
        </div>
        <input
            {...props}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange?.(Number(event.currentTarget.value))}
            aria-label={ariaLabel ?? "Slider"}
            className={classNames(styles.slider, className)}
        />
    </div>
);
