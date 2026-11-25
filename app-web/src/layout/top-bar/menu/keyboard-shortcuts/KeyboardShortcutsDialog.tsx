import { FC, useState } from "react";
import { getKeyBindingLabels, useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { useObservableState } from "@tinker-chest";
import { Dialog, Dropdown, Text } from "@web-ui";
import { KeyboardShortcutsTable } from "./KeyboardShortcutsTable";
import styles from "./keyboard-shortcuts-dialog.module.css";

interface Props {
    onClose: () => void;
}

export const KeyboardShortcutsDialog: FC<Props> = ({ onClose }) => {
    const { namespace, translationKey, keysmith } = useWebMachineWard();
    const shortcuts = useObservableState(keysmith.shortcuts$, []);
    const [filter, setFilter] = useState("");
    const translate = useTranslate();
    const title = translate({ n: namespace, t: translationKey.KeyboardShortcuts });
    const keyCounts = new Map<string, number>();

    for (const { binding } of shortcuts) {
        for (const key of new Set(getKeyBindingLabels(binding))) {
            keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
        }
    }
    
    const selectedKey = keyCounts.has(filter) ? filter : "";
    const filteredShortcuts = shortcuts.filter(({ binding }) => !selectedKey || getKeyBindingLabels(binding).includes(selectedKey));

    return (
        <Dialog
            color="primary"
            variant="fill-translucent"
            placement="right-drawer"
            header={title}
            closeText={translate({ n: namespace, t: translationKey.Close })}
            onClose={onClose}
        >
            <div className={styles["container"]}>
                <Dropdown
                    ariaLabel={translate({ n: namespace, t: translationKey.FilterShortcutKeys })}
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
                    <KeyboardShortcutsTable title={title} shortcuts={filteredShortcuts} />
                ) : (
                    <Text usage="caption" color="primary" role="status">
                        {translate({ n: namespace, t: translationKey.NoKeyboardShortcuts })}
                    </Text>
                )}
            </div>
        </Dialog>
    );
};
