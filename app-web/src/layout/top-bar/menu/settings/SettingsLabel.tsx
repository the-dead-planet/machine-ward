import { FC, ReactNode } from "react";
import { Text } from "@web-ui";
import { useTheme } from "@ui";
import styles from "./settings-dialog.module.css";

interface Props {
    id: string;
    children: ReactNode;
    inline?: boolean;
    unsaved?: string;
}

export const SettingsLabel: FC<Props> = ({ id, children, inline, unsaved }) => {
    const theme = useTheme();
    const content = (
        <>
            {children}
            {unsaved && <span className={styles['visually-hidden']}> ({unsaved})</span>}
        </>
    );
    if (inline) {
        return (
            <span id={id} className={styles['inline-label']} data-unsaved={unsaved ? true : undefined}>
                {content}
            </span>
        );
    }

    return (
        <Text
            as="span"
            usage="caption"
            id={id}
            color="primary"
            shadow={theme.isDark}
            uppercase
            className={styles["label"]}
            data-unsaved={unsaved ? true : undefined}
        >
            {content}
        </Text>
    );
};
