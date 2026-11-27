import { useEffect, useRef, useState } from "react";

export const useToolbarHeight = (hasContent: boolean) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const body = bodyRef.current;
        if (!body) {
            return;
        }
        let frame = 0;
        const update = () => {
            const nextHeight = hasContent ? body.getBoundingClientRect().height : 0;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                frame = requestAnimationFrame(() => setHeight(nextHeight));
            });
        };
        const observer = new ResizeObserver(update);
        observer.observe(body);
        update();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [hasContent]);

    return { toolbarRef, bodyRef, height };
};
