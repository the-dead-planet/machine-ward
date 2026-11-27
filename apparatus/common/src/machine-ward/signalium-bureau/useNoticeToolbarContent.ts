import { useSubjectState } from "@tinker-chest";
import { useMachineWard } from "../useMachineWard";

export const useNoticeToolbarContent = () => {
    const { individuator, signaliumBureau } = useMachineWard();
    const [notices] = useSubjectState(signaliumBureau.notices$);
    const [settings] = useSubjectState(individuator.settings$);

    return {
        language: settings.language,
        notices: [...notices].reverse(),
        onRemove: signaliumBureau.removeNotice,
    };
};
