import { FC } from "react";
import { ShortcutStatus, TranslationId, useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Text } from "@web-ui";
import { KeyboardShortcutRow } from "./KeyboardShortcutRow";
import { KeyboardShortcutsHeaderRow } from "./KeyboardShortcutsHeaderRow";
import styles from "./keyboard-shortcuts-dialog.module.css";

interface Props {
    title: string;
    shortcuts: readonly ShortcutStatus[];
}

const groupShortcutsByOwner = (shortcuts: readonly ShortcutStatus[], defaultOwner: TranslationId) => {
    const groups = new Map<string, { owner: TranslationId; shortcuts: ShortcutStatus[] }>();
    for (const shortcut of shortcuts) {
        const owner = shortcut.owner ?? defaultOwner;
        const groupId = JSON.stringify([owner.n, owner.t]);
        const group = groups.get(groupId);
        if (group) {
            group.shortcuts.push(shortcut);
        } else {
            groups.set(groupId, { owner, shortcuts: [shortcut] });
        }
    }
    return groups;
};

export const KeyboardShortcutsTable: FC<Props> = ({ title, shortcuts }) => {
    const { namespace, translationKey } = useWebMachineWard();
    const translate = useTranslate();
    const groups = groupShortcutsByOwner(shortcuts, { n: namespace, t: translationKey.MachineWard });

    return (
        <section className={styles["table-scroll"]} tabIndex={0} aria-label={title}>
            <table className={styles["shortcuts"]} aria-label={title}>
                <thead className={styles["visually-hidden"]}>
                    <KeyboardShortcutsHeaderRow />
                </thead>
                {[...groups].map(([groupId, group]) => (
                    <tbody key={groupId}>
                        <tr>
                            <th scope="rowgroup" colSpan={4}>
                                <Text usage="label" color="primary" bold>
                                    {translate(group.owner)}
                                </Text>
                            </th>
                        </tr>
                        {group.shortcuts.map((shortcut) => (
                            <KeyboardShortcutRow key={shortcut.id} shortcut={shortcut} />
                        ))}
                    </tbody>
                ))}
            </table>
        </section>
    );
};
