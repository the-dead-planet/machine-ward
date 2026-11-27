import { useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Icon, Menu, ToggleSwitch, Tooltip } from "@web-ui";
import { useObservableState } from "@tinker-chest";
import { Icons, SizeVariant } from "@ui";
import styles from './layout-menu.module.css';

export const GearsMenu = ({ size }: { size: SizeVariant }) => {
    const { engine, namespace, translationKey } = useWebMachineWard();
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
            <div className={styles['gear-switches']}>
                {gears.map(({ gear, isEngaged }) => {
                    const description = translate({ n: gear.id, t: gear.translationKey.GearDescription });
                    const color = isEngaged ? "secured" : "neutral";

                    return (
                        <div key={gear.id} className={styles['gear-row']}>
                            <ToggleSwitch
                                inputRole="menuitemcheckbox"
                                label={<span>{translate({ n: gear.id, t: gear.translationKey.GearName })}</span>}
                                labelPlacement="after"
                                checked={isEngaged}
                                size="xs"
                                onChange={(checked) => checked ? engine.engageGear(gear) : engine.disengageGear(gear)}
                            />
                            <Tooltip content={description} placement="right" color={color}>
                                <span role="img" aria-label={description}>
                                    <Icon src={Icons.NounProject.Info} size="xs" color={color} glyphsShade={500} />
                                </span>
                            </Tooltip>
                        </div>
                    );
                })}
            </div>
        </Menu>
    );
};
