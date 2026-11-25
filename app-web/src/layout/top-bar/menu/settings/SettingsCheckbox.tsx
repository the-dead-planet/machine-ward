import { FC, ReactNode } from "react";
import { Checkbox } from "@web-ui";
import { SettingsLabel } from "./SettingsLabel";
import styles from './settings-dialog.module.css';

interface Props {
    wide: boolean;
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: ReactNode;
    action?: ReactNode;
}

export const SettingsCheckbox: FC<Props> = ({ wide, id, checked, onChange, children, action }) => {
    if (action) {
        return (
            <div className={styles['checkbox-actions']}>
                <Checkbox size="xs" color="primary" labelledBy={id} checked={checked} onChange={onChange}>
                    <span id={id}>{children}</span>
                </Checkbox>
                {action}
            </div>
        );
    }

    return (
        <div className={styles['field']}>
            {wide ? (
                <>
                    <SettingsLabel id={id}>{children}</SettingsLabel>
                    <Checkbox labelledBy={id} size="xs" color="primary" checked={checked} onChange={onChange} />
                </>
            ) : (
                <Checkbox className={styles['settings-checkbox']} size="xs" color="primary" checked={checked} onChange={onChange}>
                    {children}
                </Checkbox>
            )}
        </div>
    );
};
