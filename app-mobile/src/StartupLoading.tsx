import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@mobile-ui';
import { FontType, useTheme } from '@ui';
import { useTranslation } from '@apparatus';
import { useMobileMachineWard } from '@mobile-apparatus';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export const StartupLoading = () => {
    const { namespace, translationKey } = useMobileMachineWard();
    const message = useTranslation({ n: namespace, t: translationKey.PoweringUpMachineWard });
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <ActivityIndicator accessible={false} color={theme.resolveAppearance().glyphs} />
            <Text fontType={FontType.SpecialMessaging} align="center" accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
                {message}
            </Text>
        </View>
    );
};
