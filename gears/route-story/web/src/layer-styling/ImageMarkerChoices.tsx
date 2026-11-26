import { useId } from "react";
import { getImageMarkerShapePath, ImageMarkerShape } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useTheme } from "@ui";
import { Text } from "@web-ui";
import styles from "./layer-styling.module.css";

interface Props<T extends string> {
    label: string;
    value: T;
    options: { value: T; label: string; shape: ImageMarkerShape; diameter: number }[];
    onChange: (value: T) => void;
}

export function ImageMarkerChoices<T extends string>({ label, value, options, onChange }: Props<T>) {
    const name = useId();
    const { glyphs } = useTheme().resolveAppearance("fill-translucent", "neutral");
    const optionSize = Math.max(44, ...options.map(({ diameter }) => diameter + 4));

    return (
        <fieldset className={styles["image-field"]}>
            <legend className={styles["image-field-label"]}>
                <Text as="span" usage="caption">{label}</Text>
            </legend>
            <div className={styles["image-options"]}>
                {options.map((option) => (
                    <label key={option.value} className={styles["image-option"]} title={option.label}>
                        <input
                            className={styles["image-radio"]}
                            type="radio"
                            name={name}
                            value={option.value}
                            aria-label={option.label}
                            checked={option.value === value}
                            onChange={() => onChange(option.value)}
                        />
                        <svg aria-hidden="true" width={optionSize} height={optionSize} viewBox={`0 0 ${optionSize} ${optionSize}`}>
                            <path
                                d={getImageMarkerShapePath(option.shape, option.diameter, (optionSize - option.diameter) / 2)}
                                fill="none"
                                stroke={glyphs}
                                strokeWidth={option.value === value ? 3 : 1.5}
                            />
                        </svg>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
