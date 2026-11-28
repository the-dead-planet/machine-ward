import { useSubjectState } from "@tinker-chest";
import { useMachineWard } from "../useMachineWard";
import { useTranslate } from "../translatron";

export const useGuideHints = () => {
    const { individuator, signaliumBureau } = useMachineWard();
    const [hints] = useSubjectState(signaliumBureau.hints$);
    const [{ showGuideHints }] = useSubjectState(individuator.settings$);
    const translate = useTranslate();

    return showGuideHints
        ? Array.from(hints, ([id, { text, keys }]) => ({ id, text: translate(text), keys }))
        : [];
};
