import { FC } from "react";
import { MapSection } from "./MapSection";
import { useKeysmithKeyboard } from "@web-apparatus";

export const Machine: FC = () => {
    useKeysmithKeyboard();
    
    return (
        <MapSection />
    );
};
