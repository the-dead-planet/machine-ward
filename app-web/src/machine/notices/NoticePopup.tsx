import { FC, type RefObject } from "react";
import { getNoticeMessage, noticeStatuses, useTranslate, type SignaliumNotice } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Icons } from "@ui";
import { Button, Icon, Panel, Popup, Text } from "@web-ui";
import styles from "./notices.module.css";

interface Props {
    anchor: RefObject<HTMLButtonElement | null>;
    id: string;
    title: string;
    notices: SignaliumNotice[];
    onClose: () => void;
    onRemove: (id: string) => void;
}

export const NoticePopup: FC<Props> = ({ anchor, id, title, notices, onClose, onRemove }) => {
    const { namespace, translationKey } = useWebMachineWard();
    const translate = useTranslate();
    const removeLabel = translate({ n: namespace, t: translationKey.RemoveNotice });

    return (
        <Popup
            visible
            anchor={anchor}
            triggerAnchor="bottom-right"
            popupAnchor="top-right"
            slide="to-left"
            onClose={onClose}
            borderWidth={0}
            popupClassName={styles["notice-popup"]}
        >
            <section id={id} aria-label={title} data-testid="notice-popup">
                <ul className={styles["notice-list"]}>
                    {notices.map((notice) => (
                        <li key={notice.id}>
                            <Panel color={notice.type} variant="fill-inverse" className={styles["notice-card"]}>
                                <Icon
                                    src={Icons.NounProject[noticeStatuses[notice.type].icon]}
                                    color={notice.type}
                                    glyphsShade={500}
                                    size="xs"
                                    ariaHidden={false}
                                    aria-label={translate({ n: namespace, t: noticeStatuses[notice.type].label })}
                                />
                                <Text as="p" usage="label" color={notice.type} variant="fill-inverse" className={styles["notice-card-text"]}>
                                    {getNoticeMessage(notice)}
                                </Text>
                                <Button
                                    size="xs"
                                    color={notice.type}
                                    icon={Icons.NounProject.CloseCross}
                                    tooltip={removeLabel}
                                    onClick={() => onRemove(notice.id)}
                                />
                            </Panel>
                        </li>
                    ))}
                </ul>
            </section>
        </Popup>
    );
};
