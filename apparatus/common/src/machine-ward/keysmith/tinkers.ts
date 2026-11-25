import { KeyBinding } from "./model";

/**
 * Display a binding as individual keycaps, with modifiers before the main key.
 */
export const getKeyBindingLabels = (binding: KeyBinding): string[] => {
    const arrows: Record<string, string> = {
        ArrowLeft: "←",
        ArrowRight: "→",
        ArrowUp: "↑",
        ArrowDown: "↓",
    };
    return [
        binding.control && "Ctrl",
        binding.alt && "Alt",
        binding.shift && "Shift",
        binding.meta && "Meta",
        arrows[binding.key] ?? (binding.key.length === 1 ? binding.key.toUpperCase() : binding.key),
    ].filter((label): label is string => typeof label === "string");
};
