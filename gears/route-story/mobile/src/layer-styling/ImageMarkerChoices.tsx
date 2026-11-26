import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { getImageMarkerShapePath, ImageMarkerShape } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useTheme } from "@ui";
import { Label } from "@mobile-ui";

const styles = StyleSheet.create({
    field: { gap: 4 },
    options: { flexDirection: "row", gap: 4 },
    option: {
        alignItems: "center",
        justifyContent: "center",
    },
});

interface Props<T extends string> {
    label: string;
    value: T;
    options: { value: T; label: string; shape: ImageMarkerShape; diameter: number }[];
    onChange: (value: T) => void;
}

export function ImageMarkerChoices<T extends string>({ label, value, options, onChange }: Props<T>) {
    const { glyphs } = useTheme().resolveAppearance("fill-translucent", "neutral");
    const [focused, setFocused] = useState<T | null>(null);
    const optionSize = Math.max(44, ...options.map(({ diameter }) => diameter + 4));

    return (
        <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
            <Label>{label}</Label>
            <View style={styles.options}>
                {options.map((option) => (
                    <Pressable
                        key={option.value}
                        accessibilityRole="radio"
                        accessibilityLabel={option.label}
                        accessibilityState={{ checked: option.value === value }}
                        onPress={() => onChange(option.value)}
                        onFocus={() => setFocused(option.value)}
                        onBlur={() => setFocused(null)}
                        style={[
                            styles.option,
                            focused === option.value && { outlineStyle: "solid", outlineWidth: 2, outlineColor: glyphs },
                        ]}
                    >
                        <Svg accessible={false} width={optionSize} height={optionSize} viewBox={`0 0 ${optionSize} ${optionSize}`}>
                            <Path
                                d={getImageMarkerShapePath(option.shape, option.diameter, (optionSize - option.diameter) / 2)}
                                fill="none"
                                stroke={glyphs}
                                strokeWidth={option.value === value ? 3 : 1.5}
                            />
                        </Svg>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}
