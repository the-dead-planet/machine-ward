import { useEffect, useRef, useState } from "react";
import { getNoticeTickerDuration } from "@apparatus";

export const useNoticeTicker = () => {
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
