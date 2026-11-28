import { PanelProps } from '../../hud';
import { MenuAnchor } from '../menu';
import { ReactNode } from 'react';
import type { TransitionProps } from '../../motion/transition';

export interface PopupProps extends Pick<PanelProps, 'color' | 'highlightColor' | 'highlighted' | 'disabled' | 'borderWidth'> {
    anchor?: React.RefObject<HTMLElement | null>;
    position?: { x: number; y: number };
    variant?: PanelProps['variant'];
    /** Which corner of the trigger supplies the popup's attachment point. */
    triggerAnchor?: MenuAnchor;
    /** Which popup corner attaches there. Placement may flip to stay inside the viewport. */
    popupAnchor?: MenuAnchor;
    /**
     * Overrides the entrance direction inferred from the popup anchor.
     */
    slide?: TransitionProps['slide'];
    dismissOnClickAway?: boolean;
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
}
