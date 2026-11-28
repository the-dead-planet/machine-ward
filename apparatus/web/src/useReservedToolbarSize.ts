import { useEffect, useRef } from "react";
import { ReservedToolbar } from "@apparatus";
import { useWebMachineWard } from "./machine-ward";

export const useReservedToolbarSize = <Element extends HTMLElement = HTMLDivElement>(toolbar: ReservedToolbar) => {
    const { toolsStation } = useWebMachineWard();
    const ref = useRef<Element>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }
        const update = () => toolsStation.setToolbarHeight(toolbar, element.getBoundingClientRect().height);
        const observer = new ResizeObserver(update);
        observer.observe(element);
        update();

        return () => {
            observer.disconnect();
            toolsStation.setToolbarHeight(toolbar, 0);
        };
    }, [toolbar, toolsStation]);

    return ref;
};
