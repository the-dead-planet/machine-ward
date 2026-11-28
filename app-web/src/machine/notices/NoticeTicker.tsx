import { FC } from "react";
import type { SignaliumNotice } from "@apparatus";
import { Notice } from "./Notice";
import { useNoticeTicker } from "./useNoticeTicker";
import styles from "./notices.module.css";

interface Props {
    notices: SignaliumNotice[];
    onRemove: (id: string) => void;
}

export const NoticeTicker: FC<Props> = ({ notices, onRemove }) => {
    const { ref, duration } = useNoticeTicker();

    return (
        <div className={styles["ticker-viewport"]}>
            <div
                data-testid="notice-ticker"
                ref={ref}
                className={styles.ticker}
                style={{ animationDuration: duration ? `${duration}ms` : undefined }}
            >
                {notices.map((notice) => <Notice key={notice.id} notice={notice} onRemove={onRemove} />)}
            </div>
        </div>
    );
};
