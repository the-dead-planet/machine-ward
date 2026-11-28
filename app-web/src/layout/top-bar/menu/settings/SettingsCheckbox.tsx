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
    unsaved?: string;
}

export const SettingsCheckbox: FC<Props> = ({ wide, id, checked, onChange, children, unsaved }) => {
    const label = <SettingsLabel id={id} inline={!wide} unsaved={unsaved}>{children}</SettingsLabel>;
    return (
        <div className={styles['field']}>
            {wide ? (
                <>
                    {label}
                    <Checkbox labelledBy={id} size="xs" color="primary" checked={checked} onChange={onChange} />
                </>
            ) : (
                <Checkbox className={styles['settings-checkbox']} size="xs" color="primary" checked={checked} onChange={onChange}>
                    {label}
                </Checkbox>
            )}
        </div>
    );
};
