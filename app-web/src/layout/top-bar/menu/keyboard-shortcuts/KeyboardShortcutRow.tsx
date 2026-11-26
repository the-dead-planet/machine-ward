import { FC } from "react";
import { getKeyBindingLabels, ShortcutStatus, useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Icons } from "@ui";
import { Icon, Text, Tooltip } from "@web-ui";
import styles from "./keyboard-shortcuts-dialog.module.css";

interface Props {
    shortcut: ShortcutStatus;
    shortcutsEnabled: boolean;
}

export const KeyboardShortcutRow: FC<Props> = ({ shortcut, shortcutsEnabled }) => {
    const { namespace, translationKey } = useWebMachineWard();
    const translate = useTranslate();
    const availability = translate({
        n: namespace,
        t: shortcut.present ? translationKey.Available : translationKey.Unavailable,
    });
    const guidance = shortcut.present ? shortcut.makeUnavailableHint : shortcut.requirements;
    const tooltip = guidance ? `${availability} - ${translate(guidance)}` : availability;

    return (
        <tr>
            <th scope="row">
                <Text usage="label" color="primary">
                    {translate(shortcut.label)}
                </Text>
            </th>
            <td>
                <Text usage="caption" color="primary" disabled={!shortcutsEnabled || !shortcut.present} className={styles["key-combination"]}>
                    {getKeyBindingLabels(shortcut.binding).map((label, index) => (
                        <kbd key={index} className={styles["keys"]}>{label}</kbd>
                    ))}
                </Text>
            </td>
            <td className={styles["description"]}>
                {shortcut.activationHint && (
                    <Text usage="caption" color="primary" bold>
                        {translate(shortcut.activationHint)}
                    </Text>
                )}
                <Text usage="caption" color="primary">
                    {translate(shortcut.description)}
                </Text>
            </td>
            <td>
                <Text usage="label" color="primary">
                    <Tooltip content={tooltip} size="xs" color="primary">
                        <span tabIndex={0} role="img" aria-label={availability}>
                            <Icon src={Icons.NounProject.Info} size="xs" />
                        </span>
                    </Tooltip>
                </Text>
            </td>
        </tr>
    );
};
