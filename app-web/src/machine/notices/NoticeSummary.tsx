import { FC, type RefObject } from "react";
import { noticeStatuses, useTranslate, type useNoticeReader } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { FontType, Icons } from "@ui";
import { Button, Icon, Text, Tooltip } from "@web-ui";
import styles from "./notices.module.css";

interface Props {
    anchor: RefObject<HTMLButtonElement | null>;
    counts: ReturnType<typeof useNoticeReader>["counts"];
    popupId?: string;
    title: string;
    onClick: () => void;
}

export const NoticeSummary: FC<Props> = ({ anchor, counts, popupId, title, onClick }) => {
    const { namespace } = useWebMachineWard();
    const translate = useTranslate();
    const countLabel = counts.map(({ type, count }) => `${translate({ n: namespace, t: noticeStatuses[type].label })}: ${count}`).join(", ");

    return (
        <div className={styles["notice-summary"]}>
            <Button
                ref={anchor}
                color="secondary"
                aria-label={`${title} — ${countLabel}`}
                aria-expanded={popupId !== undefined}
                aria-controls={popupId}
                onClick={onClick}
            >
                <span className={styles["notice-counts"]}>
                    {counts.map(({ type, count, countKey }) => (
                        <Tooltip key={type} content={translate({ n: namespace, t: countKey, p: { count } })}>
                            <span className={styles["notice-count"]}>
                                <Icon src={Icons.NounProject[noticeStatuses[type].icon]} color={type} glyphsShade={500} />
                                <Text usage="label" color={type} fontType={FontType.Numeric}>{count}</Text>
                            </span>
                        </Tooltip>
                    ))}
                </span>
            </Button>
        </div>
    );
};
