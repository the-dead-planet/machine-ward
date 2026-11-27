import { FC } from "react";
import classNames from "classnames";
import { MachineWardTopBarProps, useMultipleTranslations } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { FontType, useTheme } from "@ui";
import { H1, ThemeModeToggle } from "@web-ui";
import { LayoutMenu } from "./menu/LayoutMenu";
import { GearsMenu } from "./menu/GearsMenu";
import { UnderConstructionChip } from "./UnderConstructionChip";
import { useSubjectState } from "@tinker-chest";
import styles from './top-bar.module.css';

export const TopBar: FC<MachineWardTopBarProps> = ({
    title,
    description,
}) => {
    const { namespace, translationKey, individuator, toolsStation } = useWebMachineWard();
    const [media] = useSubjectState(useTheme().media$);
    const compact = media.isLessThanSm;
    const controlSize = compact ? "sm" : "md";
    const [topBarTools] = useSubjectState(toolsStation.topBarTools$);
    const [lightModeTooltip, darkModeTooltip] = useMultipleTranslations([
        { n: namespace, t: translationKey.SwitchToLightMode },
        { n: namespace, t: translationKey.SwitchToDarkMode },
    ]);

    // TODO: Icons: sound, geolocation on/off
    return (
        <nav
            ref={(instance) => {
                toolsStation.topBarSizeRef.current = instance;
            }}
            className={classNames(styles["top-bar"], compact && styles.compact)}
        >
            <div className={classNames(styles["section"], styles["left"])}>
                <GearsMenu size={controlSize} />
                <UnderConstructionChip size={controlSize} />
            </div>
            <H1 color="primary" shade={500} fontType={FontType.NeonHeader} title={description} className={styles['header']}>
                {title.toLowerCase()}
            </H1>
            <div className={classNames(styles["section"], styles["right"])}>
                {Array.from(topBarTools).map(([id, Component]) => <Component key={id} />)}
                <ThemeModeToggle
                    lightModeTooltip={lightModeTooltip}
                    darkModeTooltip={darkModeTooltip}
                    size={controlSize}
                    onToggle={individuator.toggleMode}
                />
                <LayoutMenu size={controlSize} />
            </div>
        </nav>
    );
};
