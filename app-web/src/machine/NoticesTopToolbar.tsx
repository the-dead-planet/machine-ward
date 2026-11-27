import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { getNoticeTickerDuration, useNoticeToolbarContent } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { FontType } from "@ui";
import { P } from "@web-ui";
import { Notice } from "../notices/Notice";
import styles from '../notices/notices.module.css';
import machineStyles from './machine.module.css';

const useNoticeTicker = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const ticker = ref.current;
        const viewport = ticker?.parentElement;
        if (!ticker || !viewport) {
            return;
        }
        const observer = new ResizeObserver(() => {
            const width = ticker.getBoundingClientRect().width;
            setDuration(width ? getNoticeTickerDuration(viewport.clientWidth + width) : 0);
        });
        observer.observe(ticker);
        observer.observe(viewport);

        return () => observer.disconnect();
    }, []);

    return { ref, duration };
};

export const NoticesTopToolbar = () => {
    const { notices, hints, onRemove } = useNoticeToolbarContent();
    const { toolsStation } = useWebMachineWard();
    const { ref, duration } = useNoticeTicker();

    return (
        <div
            className={classNames(machineStyles.toolbar, machineStyles.top)}
            ref={instance => { toolsStation.topToolbarSizeRef.current = instance; }}
        >
            <div className={machineStyles.content}>
                <div
                    ref={ref}
                    className={styles.ticker}
                    style={{ animationDuration: duration ? `${duration}ms` : undefined }}
                >
                    {notices.map((notice) => <Notice key={notice.id} notice={notice} onRemove={onRemove} />)}
                    {hints.map(({ id, text }) => (
                        <P role="status" className={classNames(styles.message, styles.hint)} fontType={FontType.NeonText} key={id}>
                            {text}
                        </P>
                    ))}
                </div>
            </div>
        </div>
    );
};
