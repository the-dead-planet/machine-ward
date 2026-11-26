import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useOverlayDismiss } from '../useOverlayDismiss';

const focusableSelector =
    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';

export const useDialog = (focusDialogOnOpen = false) => {
    const [render, setRender] = useState(true);
    const dialogRef = useRef<HTMLDivElement>(null);
    const close = () => setRender(false);
    useOverlayDismiss({
        visible: render,
        containerRef: dialogRef,
        dismissOnClickAway: false,
        onClose: close,
    });
    useEffect(() => {
        const previousFocus = document.activeElement;
        const initialControl = focusDialogOnOpen
            ? dialogRef.current
            : dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
        initialControl?.focus({ preventScroll: true });

        return () => {
            if (
                previousFocus instanceof HTMLElement &&
                previousFocus.isConnected
            ) {
                previousFocus.focus({ preventScroll: true });
            }
        };
    }, []);

    const onKeyDown = (event: KeyboardEvent) => {
        if (
            event.key !== 'Tab' ||
            !dialogRef.current?.contains(event.target as Node)
        ) {
            return;
        }
        const controls =
            dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        const first = controls[0];
        const last = controls[controls.length - 1];

        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
    };
    return { render, close, dialogRef, onKeyDown };
};
