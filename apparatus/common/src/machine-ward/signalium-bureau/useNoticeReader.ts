import { useState } from "react";
import { MachineTranslationKey as Translation } from "../model";
import { type Language, Translatron } from "../translatron";
import { SignaliumNotice } from "./model";

export const noticeStatuses = {
    glitch: { icon: "Glitch", label: Translation.Glitch, one: Translation.OneGlitch, few: Translation.FewGlitches, many: Translation.GlitchCount },
    hazard: { icon: "Hazard", label: Translation.Hazard, one: Translation.OneHazard, few: Translation.FewHazards, many: Translation.HazardCount },
    intel: { icon: "Intel", label: Translation.Intel, one: Translation.OneIntel, few: Translation.FewIntel, many: Translation.IntelCount },
    secured: { icon: "Secured", label: Translation.Secured, one: Translation.OneSecured, few: Translation.FewSecured, many: Translation.SecuredCount },
} as const;

const noticeTypes = Object.keys(noticeStatuses) as SignaliumNotice["type"][];

export const getNoticeCountKey = (type: SignaliumNotice["type"], count: number, language: Language): Translation => {
    const { one, few, many } = noticeStatuses[type];
    const plural = new Intl.PluralRules(Translatron.languages[language].locale).select(count);
    if (plural === "one") {
        return one;
    }
    return plural === "few" ? few : many;
};

export const useNoticeReader = (notices: SignaliumNotice[], onRemove: (id: string) => void, language: Language) => {
    const [snapshot, setSnapshot] = useState<SignaliumNotice[] | null>(null);
    const counts: Record<SignaliumNotice["type"], number> = {
        glitch: 0,
        hazard: 0,
        intel: 0,
        secured: 0,
    };
    for (const notice of notices) {
        counts[notice.type]++;
    }

    return {
        counts: noticeTypes.filter((type) => counts[type] > 0).map((type) => {
            const count = counts[type];
            return { type, count, countKey: getNoticeCountKey(type, count, language) };
        }),
        snapshot,
        open: () => setSnapshot([...notices]),
        close: () => setSnapshot(null),
        remove: (id: string) => {
            onRemove(id);
            setSnapshot((current) => {
                const remaining = current?.filter((notice) => notice.id !== id);
                return remaining?.length ? remaining : null;
            });
        },
    };
};

export const getNoticeMessage = (notice: SignaliumNotice): string =>
    notice.type === "glitch" && notice.error.message
        ? `${notice.text} ${notice.error.message}`
        : notice.text;
