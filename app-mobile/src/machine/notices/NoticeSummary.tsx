import { FC, type RefObject } from "react";
import { Pressable, StyleSheet, type HostInstance, View } from "react-native";
import { noticeStatuses, useTranslate, type useNoticeReader } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { Icon, Text, Tooltip } from "@mobile-ui";
import { FontType, Icons, withColorOpacity } from "@ui";

const styles = StyleSheet.create({
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        borderStartWidth: 1,
    },
    count: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
});

interface Props {
    anchor: RefObject<HostInstance | null>;
    counts: ReturnType<typeof useNoticeReader>["counts"];
    expanded: boolean;
    secondary: string;
    title: string;
    onPress: () => void;
}

export const NoticeSummary: FC<Props> = ({ anchor, counts, expanded, secondary, title, onPress }) => {
    const { namespace } = useMobileMachineWard();
    const translate = useTranslate();
    const countLabel = counts.map(({ type, count }) => `${translate({ n: namespace, t: noticeStatuses[type].label })}: ${count}`).join(", ");

    return (
        <Pressable
            ref={anchor}
            accessibilityRole="button"
            accessibilityLabel={`${title} — ${countLabel}`}
            accessibilityState={{ expanded }}
            onPress={onPress}
            style={({ pressed }) => [styles.summary, {
                borderStartColor: secondary,
                backgroundColor: pressed ? withColorOpacity(secondary, 0.2) : undefined,
            }]}
        >
            {counts.map(({ type, count, countKey }) => (
                <Tooltip key={type} content={translate({ n: namespace, t: countKey, p: { count } })}>
                    <View style={styles.count}>
                        <Icon icon={Icons.NounProject[noticeStatuses[type].icon]} color={type} glyphsShade={500} />
                        <Text usage="label" color={type} fontType={FontType.Numeric}>{count}</Text>
                    </View>
                </Tooltip>
            ))}
        </Pressable>
    );
};
