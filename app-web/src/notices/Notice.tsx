import { FC } from "react";
import { SignaliumNotice, useTranslation } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Button, P } from "@web-ui";
import { FontType, Icons } from "@ui";
import styles from './notices.module.css';

interface Props {
    notice: SignaliumNotice;
    onRemove: (id: string) => void;
}
export const Notice: FC<Props> = ({
    notice,
    onRemove
}) => {
    const { namespace, translationKey } = useWebMachineWard();
    const close = useTranslation({ n: namespace, t: translationKey.Close });

    return (
        <div className={styles.notice}>
            <P
                className={styles.message}
                role={notice.type === 'glitch' ? 'alert' : 'status'}
                fontType={FontType.NeonText}
                variant="fill-translucent"
                color={notice.type}
            >
                {notice.text} {notice.type === 'glitch' ? notice.error.message : ''}
            </P>
            <Button
                size="xs"
                color={notice.type}
                icon={Icons.NounProject.Clear}
                aria-label={close}
                onClick={() => onRemove(notice.id)}
            />
        </div>
    );
};
