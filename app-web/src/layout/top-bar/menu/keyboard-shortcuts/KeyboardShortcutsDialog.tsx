import { FC, useId, useState } from "react";
import { getKeyBindingLabels, ShortcutStatus, useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { useObservableState, useSubjectState } from "@tinker-chest";
import { Icons } from "@ui";
import { Button, Chip, Dialog, Dropdown, Text } from "@web-ui";
import { KeyboardShortcutsTable } from "./KeyboardShortcutsTable";
import styles from "./keyboard-shortcuts-dialog.module.css";

interface Props {
    onClose: () => void;
    onOpenIndividuator: () => void;
}

const countShortcutsByKey = (shortcuts: readonly ShortcutStatus[]) => {
    const keyCounts = new Map<string, number>();

    for (const { binding } of shortcuts) {
        for (const key of new Set(getKeyBindingLabels(binding))) {
            keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
        }
    }
    return keyCounts;
};

export const KeyboardShortcutsDialog: FC<Props> = ({ onClose, onOpenIndividuator }) => {
    const { namespace, translationKey, keysmith, individuator } = useWebMachineWard();
    const [{ enableKeyboardShortcuts }] = useSubjectState(individuator.settings$);
    const shortcuts = useObservableState(keysmith.shortcuts$, []);
    const [filter, setFilter] = useState("");
    const filterLabelId = useId();
    const translate = useTranslate();
    const subtitle = translate({ n: namespace, t: translationKey.KeyboardShortcuts });
    const keyCounts = countShortcutsByKey(shortcuts);
    const selectedKey = keyCounts.has(filter) ? filter : "";
    const filteredShortcuts = shortcuts.filter(({ binding }) => !selectedKey || getKeyBindingLabels(binding).includes(selectedKey));

    return (
        <Dialog
            color="primary"
            variant="fill-translucent"
            placement="right-drawer"
            header={translate({ n: namespace, t: translationKey.Keysmith })}
            className={styles["drawer"]}
            closeText={translate({ n: namespace, t: translationKey.Close })}
            onClose={onClose}
            headerEnd={(
                <div className={styles["shortcut-settings"]}>
                    <Chip variant="fill" color={enableKeyboardShortcuts ? "secured" : "glitch"}>
                        {translate({
                            n: namespace,
                            t: enableKeyboardShortcuts ? translationKey.Enabled : translationKey.Disabled,
                        })}
                    </Chip>
                    <Button
                        size="xs"
                        color="primary"
                        icon={Icons.NounProject.GoTo}
                        tooltip={translate({ n: individuator.namespace, t: individuator.translationKey.GoToIndividuator })}
                        onClick={onOpenIndividuator}
                    />
                </div>
            )}
        >
            <div className={styles["container"]}>
                <Text as="p" usage="label" color="primary" className={styles["subtitle"]}>
                    {subtitle}
                </Text>
                <Text id={filterLabelId} usage="caption" color="primary" className={styles["filter-label"]}>
                    {translate({ n: namespace, t: translationKey.FilterShortcutKeys })}
                </Text>
                <Dropdown
                    labelledBy={filterLabelId}
                    value={selectedKey}
                    options={[
                        {
                            value: "",
                            label: `${translate({ n: namespace, t: translationKey.AllShortcutKeys })} (${shortcuts.length}/${shortcuts.length})`,
                        },
                        ...Array.from(keyCounts, ([key, count]) => ({
                            value: key,
                            label: `${key} (${count}/${shortcuts.length})`,
                        })),
                    ]}
                    onChange={setFilter}
                    color="primary"
                    size="sm"
                    disabled={keyCounts.size === 0}
                />
                {filteredShortcuts.length > 0 ? (
                    <KeyboardShortcutsTable title={subtitle} shortcuts={filteredShortcuts} shortcutsEnabled={enableKeyboardShortcuts} />
                ) : (
                    <Text usage="caption" color="primary" role="status">
                        {translate({ n: namespace, t: translationKey.NoKeyboardShortcuts })}
                    </Text>
                )}
            </div>
        </Dialog>
    );
};
