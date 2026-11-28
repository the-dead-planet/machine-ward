import { getKeyBindingLabels, ShortcutStatus } from "../keysmith";
import { SignaliumHint } from "./model";

export const getActiveShortcutHints = (shortcuts: readonly ShortcutStatus[]): ReadonlyMap<string, SignaliumHint> =>
    new Map(shortcuts
        .filter((shortcut) => shortcut.active)
        .map((shortcut): [string, SignaliumHint] => [
            shortcut.id,
            {
                text: shortcut.label,
                keys: getKeyBindingLabels(shortcut.binding),
            },
        ]));
