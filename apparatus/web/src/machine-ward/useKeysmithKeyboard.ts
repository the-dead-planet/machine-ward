import { useEffect } from "react";
import { useWebMachineWard } from "./useWebMachineWard";

const shortcutOwningControls = [
    'input', 'textarea', 'select', '[contenteditable]:not([contenteditable="false"])',
    'dialog', '[role="dialog"]', '[role="alertdialog"]',
    '[role="slider"]', '[role="spinbutton"]', '[role="separator"]',
    '[role="combobox"]', '[role="listbox"]', '[role="menu"]', '[role="menubar"]',
    '[role="tablist"]', '[role="tree"]', '[role="grid"]', '[role="radiogroup"]',
    '[role="toolbar"]', '[aria-haspopup][aria-expanded="true"]',
].join(', ');

/**
 * Dispatch page shortcuts without taking over menus, dialogs, or text composition.
 */
export const useKeysmithKeyboard = () => {
    const { keysmith, cartomancer, individuator } = useWebMachineWard();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!individuator.settings$.value.enableKeyboardShortcuts || event.defaultPrevented || event.isComposing) {
                return;
            }
            const target = event.target;
            if (!(target instanceof Element) || target.closest(shortcutOwningControls)) {
                return;
            }
            const canvas = cartomancer.map?.getCanvas();
            if (!event.key.startsWith('Arrow') && target !== document.body && target !== canvas) {
                return;
            }
            if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]')) {
                return;
            }
            if (keysmith.handleKey({
                key: event.key,
                control: event.ctrlKey,
                shift: event.shiftKey,
                alt: event.altKey,
                meta: event.metaKey,
            }, event.repeat)) {
                event.preventDefault();
            }
        };
        const handleMapKeyDown = (event: KeyboardEvent) => {
            if (!event.defaultPrevented && event.target === cartomancer.map?.getCanvas()) {
                handleKeyDown(event);
                if (event.defaultPrevented) {
                    event.stopPropagation();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keydown", handleMapKeyDown, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keydown", handleMapKeyDown, true);
        };
    }, [keysmith, cartomancer, individuator]);
};
