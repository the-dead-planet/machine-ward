import { FC } from "react";
import { StyleSheet, View } from "react-native";
import {
    DEFAULT_COLOR,
    DEFAULT_SIZE,
    DEFAULT_SURFACE_VARIANT,
    KEYCAP_FONT_TYPE,
    KEYCAP_HEIGHT_INSET,
    KeycapProps,
    useTheme,
} from "@ui";
import { Caption } from "../../design-system/typography";

const styles = StyleSheet.create({
    keycap: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
        boxSizing: "border-box",
        borderRadius: 2,
    },
});

export const Keycap: FC<KeycapProps> = ({
    color = DEFAULT_COLOR,
    highlighted,
    highlightColor,
    size = DEFAULT_SIZE,
    variant = DEFAULT_SURFACE_VARIANT,
    disabled,
    children,
}) => {
    const theme = useTheme();
    const metrics = theme.sizes.control[size];
    const minSide = metrics.height - KEYCAP_HEIGHT_INSET;
    const state = disabled ? "disabled" : highlighted ? "active-pressed" : "default";
    const appearance = theme.resolveAppearance(
        variant,
        color,
        highlightColor ?? color,
        state,
    );

    return (
        <View
            style={[styles.keycap, {
                minHeight: minSide,
                minWidth: minSide,
                paddingVertical: metrics.paddingBlock,
                paddingHorizontal: metrics.iconPaddingInline,
                backgroundColor: appearance.surface,
                borderColor: appearance.border.color,
                borderWidth: appearance.border.width,
            }]}
        >
            <Caption
                fontType={KEYCAP_FONT_TYPE}
                fontWeight={appearance.fontWeight}
                nowrap
                style={{ color: appearance.glyphs }}
            >
                {children}
            </Caption>
        </View>
    );
};
