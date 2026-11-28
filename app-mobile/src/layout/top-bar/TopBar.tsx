import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, FontType, Icons } from "@ui";
import { Button, resolveElevationStyle, Text, ThemeModeToggle, topBarBackAction$ } from '@mobile-ui';
import { MachineWardTopBarProps, useMultipleTranslations } from "@apparatus";
import { useSubjectState } from "@tinker-chest";
import { useMobileMachineWard, useReservedToolbarSize } from "@mobile-apparatus";
import { RootStackParamList } from "../../navigation";
import { UnderConstructionChip } from "./UnderConstructionChip";
import { TOP_BAR_HEIGHT } from "../../machine-sizes";
import { LayoutMenu } from "./menu/LayoutMenu";
import { GearsMenu } from "./menu/GearsMenu";

const styles = StyleSheet.create({
    container: {
        height: TOP_BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    constructionChip: {
        transform: [{ translateY: StyleSheet.hairlineWidth }],
    },
    header: {
        fontSize: 12,
        lineHeight: 16,
        includeFontPadding: false,
    },
    rightSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'flex-end',
    },
});

export const TopBar: FC<MachineWardTopBarProps<keyof RootStackParamList>> = ({
    title,
    onNavigate,
    onNavigateBack,
}) => {
    const theme = useTheme();
    const appearance = theme.resolveAppearance();
    const { individuator, namespace, translationKey, toolsStation } = useMobileMachineWard();
    const onToolbarLayout = useReservedToolbarSize('topBar');
    const [topBarTools] = useSubjectState(toolsStation.topBarTools$);
    const [topBarBackAction] = useSubjectState(topBarBackAction$);
    const [goBackTooltip, lightModeTooltip, darkModeTooltip] = useMultipleTranslations([
        { n: namespace, t: translationKey.GoBack },
        { n: namespace, t: translationKey.SwitchToLightMode },
        { n: namespace, t: translationKey.SwitchToDarkMode },
    ]);

    return (
        <View
            onLayout={onToolbarLayout}
            style={[styles.container, {
                backgroundColor: appearance.surface,
                ...resolveElevationStyle(theme, 'raised'),
            }]}
        >
            <View style={styles.leftSection}>
                {topBarBackAction ? (
                    <Button
                        icon={Icons.NounProject.NavigateBack}
                        size="sm"
                        onPress={topBarBackAction.onBack ?? onNavigateBack}
                        tooltip={goBackTooltip}
                        tooltipPlacement="bottom"
                        accessibilityLabel={goBackTooltip}
                    />
                ) : null}
                <GearsMenu size="sm" />
                <View style={styles.constructionChip}>
                    <UnderConstructionChip size="sm" />
                </View>
            </View>
            <Text
                fontType={FontType.NeonHeader}
                color="primary"
                shade={500}
                nowrap
                style={styles.header}
            >
                {title.toLowerCase()}
            </Text>
            <View style={styles.rightSection}>
                {Array.from(topBarTools).map(([id, Component]) => <Component key={id} />)}
                <ThemeModeToggle
                    lightModeTooltip={lightModeTooltip}
                    darkModeTooltip={darkModeTooltip}
                    size="sm"
                    onToggle={individuator.toggleMode}
                />
                <LayoutMenu onNavigate={onNavigate} size="sm" />
            </View>
        </View>
    );
};
