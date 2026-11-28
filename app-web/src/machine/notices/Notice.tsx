import { FC } from "react";
import { getNoticeMessage, noticeStatuses, SignaliumNotice, useTranslation } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Button, Icon, P } from "@web-ui";
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
    const removeLabel = useTranslation({ n: namespace, t: translationKey.RemoveNotice });

    return (
        <div className={styles.notice}>
            <Icon src={Icons.NounProject[noticeStatuses[notice.type].icon]} color={notice.type} glyphsShade={500} />
            <P
                className={styles.message}
                role={notice.type === 'glitch' ? 'alert' : 'status'}
                fontType={FontType.NeonText}
                variant="fill-translucent"
                color={notice.type}
            >
                {getNoticeMessage(notice)}
            </P>
            <Button
                size="xs"
                color={notice.type}
                icon={Icons.NounProject.CloseCross}
                tooltip={removeLabel}
                onClick={() => onRemove(notice.id)}
            />
        </div>
    );
};
