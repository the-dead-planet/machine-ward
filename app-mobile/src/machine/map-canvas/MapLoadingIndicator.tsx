import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Panel, Text } from '@mobile-ui';
import { FontType, useTheme } from '@ui';
import { useTranslate } from '@apparatus';
import { useMobileMachineWard } from '@mobile-apparatus';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    panel: {
        maxWidth: 360,
        padding: 16,
        gap: 12,
        alignItems: 'center',
    },
});

interface Props {
    hasFailed: boolean;
    onDismiss: () => void;
}

export const MapLoadingIndicator = ({ hasFailed, onDismiss }: Props) => {
    const { namespace, translationKey } = useMobileMachineWard();
    const translate = useTranslate();
    const theme = useTheme();

    return (
        <View style={styles.container} pointerEvents="box-none">
            <Panel style={styles.panel}>
                {!hasFailed ? <ActivityIndicator accessible={false} color={theme.resolveAppearance().glyphs} /> : null}
                <Text fontType={FontType.SpecialMessaging} align="center" accessibilityLiveRegion="polite" accessibilityState={{ busy: !hasFailed }}>
                    {translate({ n: namespace, t: hasFailed ? translationKey.MapLoadingFailed : translationKey.LoadingMap })}
                </Text>
                <Button onPress={onDismiss}>
                    {translate({ n: namespace, t: translationKey.Close })}
                </Button>
            </Panel>
        </View>
    );
};
