import { StyleSheet, View } from "react-native";
import { useTranslate } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { Icon, Menu, Text, ToggleSwitch, Tooltip } from "@mobile-ui";
import { useObservableState } from "@tinker-chest";
import { Icons, SizeVariant, useTheme } from "@ui";

const styles = StyleSheet.create({
    list: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 8,
    },
    label: {
        flexShrink: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
});

export const GearsMenu = ({ size }: { size: SizeVariant }) => {
    const { engine, namespace, translationKey } = useMobileMachineWard();
    const theme = useTheme();
    const { fontSize } = theme.sizes.control[size];
    const gears = useObservableState(engine.gearsWithEngaged$, []);
    const translate = useTranslate();
    const label = translate({ n: namespace, t: translationKey.Gears });

    return (
        <Menu
            icon={Icons.NounProject.Gear}
            iconColor="secondary"
            iconActiveColor="secondary"
            size={size}
            placement="bottom-left"
            triggerAccessibilityLabel={label}
            tooltip={label}
            tooltipPlacement="bottom"
        >
            <View style={styles.list}>
                {gears.map(({ gear, isEngaged }) => {
                    const gearName = translate({ n: gear.id, t: gear.translationKey.GearName });
                    const description = translate({ n: gear.id, t: gear.translationKey.GearDescription });
                    const color = isEngaged ? "secured" : "neutral";

                    return (
                        <View key={gear.id} style={styles.row}>
                            <ToggleSwitch
                                ariaLabel={gearName}
                                labelPlacement="after"
                                checked={isEngaged}
                                size="xs"
                                onChange={(checked) => checked ? engine.engageGear(gear) : engine.disengageGear(gear)}
                            >
                                <Text style={[styles.label, { fontSize }]}>{gearName}</Text>
                            </ToggleSwitch>
                            <Tooltip content={description} placement="right" color={color}>
                                <View accessible accessibilityRole="image" accessibilityLabel={description}>
                                    <Icon icon={Icons.NounProject.Info} size="xs" color={color} glyphsShade={500} />
                                </View>
                            </Tooltip>
                        </View>
                    );
                })}
            </View>
        </Menu>
    );
};
