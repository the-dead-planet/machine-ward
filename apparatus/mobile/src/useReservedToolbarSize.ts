import { useEffect, useRef } from "react";
import { LayoutChangeEvent } from "react-native";
import { ReservedToolbar } from "@apparatus";
import { useMobileMachineWard } from "./machine-ward";

export const useReservedToolbarSize = (toolbar: ReservedToolbar) => {
    const { toolsStation } = useMobileMachineWard();
    const heightRef = useRef(0);

    useEffect(() => {
        toolsStation.setToolbarHeight(toolbar, heightRef.current);
        return () => toolsStation.setToolbarHeight(toolbar, 0);
    }, [toolbar, toolsStation]);

    return (event: LayoutChangeEvent) => {
        heightRef.current = event.nativeEvent.layout.height;
        toolsStation.setToolbarHeight(toolbar, heightRef.current);
    };
};
