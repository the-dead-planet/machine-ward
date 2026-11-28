import { ComponentProps, FC, ReactNode, useId } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import {
    DEFAULT_COLOR,
    actionButtonVariants,
    DEFAULT_FILL_VARIANT,
    DialogPlacement,
    DialogProps,
    FontType,
    TransitionProps,
    useTheme,
} from '@ui';
import { useSubjectState } from '@tinker-chest';
import { HudSurface } from '../../hud/HudSurface';
import surface from '../../hud/surface.module.css';
import { Button } from '../../gizmos/button';
import { H3 } from '../../design-system/typography';
import { Transition } from '../../motion/transition';
import styles from './dialog.module.css';
import { useDialog } from './useDialog';

type Props = DialogProps & ComponentProps<'div'> & {
    headerEnd?: ReactNode;
    footerStart?: ReactNode;
};

export const Dialog: FC<Props> = ({
    backdrop = true,
    header,
    color = DEFAULT_COLOR,
    variant = DEFAULT_FILL_VARIANT,
    placement = 'middle',
    closeText,
    onClose,
    save,
    headerEnd,
    footerStart,
    className,
    children,
    ...props
}) => {
    const { render, close, dialogRef, onKeyDown } = useDialog(Boolean(headerEnd));
    const headerId = useId();
    const theme = useTheme();
    const [media] = useSubjectState(theme.media$);
    const slide: { [key in DialogPlacement]: TransitionProps['slide'] } = {
        ['middle']: 'to-bottom',
        ['left-drawer']: 'to-right',
        ['right-drawer']: 'to-left',
    };
    const isWide = !media.isLessThanSm;

    return createPortal(
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headerId}
            tabIndex={headerEnd ? -1 : undefined}
            className={styles['overlay']}
            data-appearance-mode={theme.mode}
            data-backdrop={(backdrop && render) || undefined}
            onKeyDown={onKeyDown}
        >
            <Transition
                render={render}
                slide={slide[placement]}
                fade
                onUnmount={onClose}
            >
                <div
                    className={classNames(
                        styles['container'],
                        isWide ? styles[placement] : styles['full-width'],
                        className,
                    )}
                    {...props}
                >
                    <HudSurface
                        as="div"
                        rectangle
                        variant={variant}
                        color={color}
                        className={classNames(
                            surface['layer-dialog'],
                            styles['dialog'],
                        )}
                    >
                        <header className={styles['header']}>
                            <H3
                                id={headerId}
                                fontType={FontType.NeonText}
                                uppercase
                                fontWeight={500}
                                color={color}
                                shadow={
                                    variant === 'fill-translucent' &&
                                    theme.mode === 'dark'
                                }
                            >
                                {header}
                            </H3>
                            {headerEnd && <div className={styles['header-end']}>{headerEnd}</div>}
                        </header>
                        <div
                            className={styles['content']}
                            data-appearance-mode={theme.mode}
                        >
                            {children}
                        </div>
                        <footer className={styles['footer']}>
                            {footerStart && <div className={styles['footer-start']}>{footerStart}</div>}
                            <Button
                                variant={actionButtonVariants[variant].inactive}
                                color={color}
                                onClick={close}
                            >
                                {closeText}
                            </Button>
                            {save ? (
                                <Button
                                    variant={
                                        actionButtonVariants[variant].active
                                    }
                                    color={color}
                                    onClick={() => {
                                        save.onSave();
                                        close();
                                    }}
                                >
                                    {save.saveText}
                                </Button>
                            ) : null}
                        </footer>
                    </HudSurface>
                </div>
            </Transition>
        </div>,
        document.body,
    );
};
