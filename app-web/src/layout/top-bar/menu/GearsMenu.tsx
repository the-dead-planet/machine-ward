import { useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Menu, ToggleSwitch } from "@web-ui";
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
                {gears.map(({ gear, isEngaged }) => (
                    <ToggleSwitch
                        key={gear.id}
                        inputRole="menuitemcheckbox"
                        label={<span>{translate({ n: gear.id, t: gear.translationKey.GearName })}</span>}
                        labelPlacement="after"
                        checked={isEngaged}
                        size="sm"
                        onChange={(checked) => checked ? engine.engageGear(gear) : engine.disengageGear(gear)}
                    />
                ))}
            </div>
        </Menu>
    );
};
