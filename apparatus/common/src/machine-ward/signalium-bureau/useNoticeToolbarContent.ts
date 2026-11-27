import { useSubjectState } from "@tinker-chest";
import { useMachineWard } from "../useMachineWard";
import { useTranslate } from "../translatron";

export const useNoticeToolbarContent = () => {
    const { individuator, signaliumBureau } = useMachineWard();
    const [notices] = useSubjectState(signaliumBureau.notices$);
    const [hints] = useSubjectState(signaliumBureau.hints$);
    const [settings] = useSubjectState(individuator.settings$);
    const translate = useTranslate();

    return {
        notices: [...notices].reverse(),
        hints: settings.showGuideHints ? Array.from(hints, ([id, hint]) => ({ id, text: translate(hint) })) : [],
        onRemove: signaliumBureau.removeNotice,
    };
};
