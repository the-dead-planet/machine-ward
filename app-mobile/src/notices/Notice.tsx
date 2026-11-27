import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from '@mobile-ui';
import { SignaliumNotice, useTranslate } from "@apparatus";
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

    return (
        <View style={styles.container}>
            <View accessibilityLiveRegion={notice.type === 'glitch' ? 'assertive' : 'polite'}>
                <Text fontType={FontType.NeonText} variant="fill-translucent" color={notice.type} nowrap>
                    {notice.text} {notice.type === 'glitch' ? notice.error.message : ''}
                </Text>
            </View>
            <Button
                size="xs"
                color={notice.type}
                icon={Icons.NounProject.Clear}
                accessibilityLabel={translate({ n: namespace, t: translationKey.Close })}
                onPress={() => onRemove(notice.id)}
            />
        </View>
    );
};
