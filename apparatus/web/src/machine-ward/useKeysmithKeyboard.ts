import { useEffect } from "react";
import { useWebMachineWard } from "./useWebMachineWard";

/**
 * Dispatch page shortcuts without taking over focused controls, dialogs, or text composition.
 */
export const useKeysmithKeyboard = () => {
    const { keysmith, cartomancer, individuator } = useWebMachineWard();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!individuator.settings$.value.enableKeyboardShortcuts || event.defaultPrevented || event.isComposing) {
                return;
            }
            const target = event.target;
            const canvas = cartomancer.map?.getCanvas();
            if (!(target instanceof HTMLElement) || (target !== document.body && target !== canvas && !target.hasAttribute("data-keysmith-target"))) {
                return;
            }
            if (target.isContentEditable || target.closest('dialog, [role="dialog"], [role="alertdialog"]')) {
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
