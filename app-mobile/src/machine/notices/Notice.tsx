import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Icon, Text } from '@mobile-ui';
import { getNoticeMessage, noticeStatuses, SignaliumNotice, useTranslate } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { FontType, Icons } from "@ui";

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
    },
});

interface Props {
    notice: SignaliumNotice;
    onRemove: (id: string) => void;
}

export const Notice: FC<Props> = ({
    notice,
    onRemove
}) => {
    const { namespace, translationKey } = useMobileMachineWard();
    const translate = useTranslate();
    const removeLabel = translate({ n: namespace, t: translationKey.RemoveNotice });

    return (
        <View style={styles.container}>
            <Icon icon={Icons.NounProject[noticeStatuses[notice.type].icon]} color={notice.type} glyphsShade={500} />
            <View accessibilityLiveRegion={notice.type === 'glitch' ? 'assertive' : 'polite'}>
                <Text fontType={FontType.NeonText} variant="fill-translucent" color={notice.type} nowrap>
                    {getNoticeMessage(notice)}
                </Text>
            </View>
            <Button
                size="xs"
                color={notice.type}
                icon={Icons.NounProject.CloseCross}
                accessibilityLabel={removeLabel}
                tooltip={removeLabel}
                onPress={() => onRemove(notice.id)}
            />
        </View>
    );
};
