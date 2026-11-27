import { StyleSheet, View } from "react-native";
import { PANEL_HEADER_CURVE_SIZES, useGuideHints } from "@apparatus";
import { FontType } from "@ui";
import { Caption, Keycap } from "@mobile-ui";

const styles = StyleSheet.create({
    hints: {
        position: 'absolute',
        bottom: PANEL_HEADER_CURVE_SIZES.size + 8,
        left: 20,
        right: 8,
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    message: {
        flexShrink: 1,
    },
});

export const MapGuideHints = () => {
    const hints = useGuideHints();

    return hints.length > 0 ? (
        <View testID="map-guide-hints" pointerEvents="none" style={styles.hints}>
            {hints.map(({ id, keys, text }) => (
                <View key={id} style={styles.row}>
                    {keys?.map((key, index) => (
                        <Keycap key={index} size="xs" variant="fill-inverse">
                            {key}
                        </Keycap>
                    ))}
                    <Caption fontType={FontType.NeonText} style={styles.message}>
                        {text}
                    </Caption>
                </View>
            ))}
        </View>
    ) : null;
};
