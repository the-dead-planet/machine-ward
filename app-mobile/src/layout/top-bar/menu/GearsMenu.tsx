import { StyleSheet, View } from "react-native";
import { useTranslate } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { Menu, Text, ToggleSwitch } from "@mobile-ui";
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
                    return (
                        <ToggleSwitch
                            key={gear.id}
                            ariaLabel={gearName}
                            labelPlacement="after"
                            checked={isEngaged}
                            size="xs"
                            onChange={(checked) => checked ? engine.engageGear(gear) : engine.disengageGear(gear)}
                        >
                            <Text style={[styles.label, { fontSize }]}>{gearName}</Text>
                        </ToggleSwitch>
                    );
                })}
            </View>
        </Menu>
    );
};
