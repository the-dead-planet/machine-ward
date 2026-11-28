import classNames from "classnames";
import { FC, useId, useRef } from "react";
import { useNoticeReader, useNoticeToolbarContent, useTranslate } from "@apparatus";
import { useReservedToolbarSize, useWebMachineWard } from "@web-apparatus";
import machineStyles from "../machine.module.css";
import { NoticePopup } from "./NoticePopup";
import { NoticeSummary } from "./NoticeSummary";
import { NoticeTicker } from "./NoticeTicker";
import { useToolbarHeight } from "./useToolbarHeight";
import styles from "./notices.module.css";

export const NoticesTopToolbar: FC = () => {
    const { notices, onRemove, language } = useNoticeToolbarContent();
    const { namespace, translationKey } = useWebMachineWard();
    const toolbarRef = useReservedToolbarSize('notices');
    const translate = useTranslate();
    const reader = useNoticeReader(notices, onRemove, language);
    const summaryRef = useRef<HTMLButtonElement>(null);
    const popupId = useId();
    const title = translate({ n: namespace, t: translationKey.Notices });
    const hasNotices = notices.length > 0;
    const showNoticeRow = hasNotices || reader.snapshot !== null;
    const { bodyRef, height } = useToolbarHeight(showNoticeRow);

    return (
        <>
            <div
                data-testid="notices-toolbar"
                className={classNames(machineStyles.toolbar, machineStyles.top)}
                style={{ height }}
                ref={toolbarRef}
            >
                <div className={machineStyles.content}>
                    <div data-testid="notices-body" ref={bodyRef}>
                        {showNoticeRow ? (
                            <div className={styles["notice-row"]}>
                                <NoticeTicker notices={notices} onRemove={onRemove} />
                                <NoticeSummary
                                    anchor={summaryRef}
                                    counts={reader.counts}
                                    popupId={reader.snapshot ? popupId : undefined}
                                    title={title}
                                    onClick={reader.snapshot ? reader.close : reader.open}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {reader.snapshot ? (
                <NoticePopup
                    anchor={summaryRef}
                    id={popupId}
                    title={title}
                    notices={reader.snapshot}
                    onClose={reader.close}
                    onRemove={reader.remove}
                />
            ) : null}
        </>
    );
};
