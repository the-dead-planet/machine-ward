import { TranslationId } from "../translatron";
import type { Observable } from "rxjs";

export interface KeyBinding {
    key: string;
    control?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}

export interface ShortcutDefinition {
    /**
     * Stable, namespaced action ID.
     */
    id: string;
    /**
     * Translated group name; defaults to Machine Ward in the overview.
     */
    owner?: TranslationId;
    label: TranslationId;
    description: TranslationId;
    /**
     * Instructions for meeting the runtime condition, shown above the description.
     */
    activationHint?: TranslationId;
    /**
     * How to make an absent shortcut present.
     */
    requirements?: TranslationId;
    /**
     * How to make a present shortcut unavailable.
     */
    makeUnavailableHint?: TranslationId;
    binding: KeyBinding;
    /**
     * Whether held-key repeats can execute this shortcut. Off by default.
     */
    allowRepeat?: boolean;
}

export interface ShortcutRegistration extends ShortcutDefinition {
    /**
     * Whether the shortcut's context is present. Defaults to true.
     */
    presence$?: Observable<boolean>;
    /**
     * Whether the action can run within that context, e.g. a marker is selected.
     */
    availability$: Observable<boolean>;
    execute: () => void;
}

export interface ShortcutStatus extends ShortcutDefinition {
    /**
     * Context status shown by the overview.
     */
    present: boolean;
    /**
     * Execution readiness: the context is present and the action is available.
     */
    active: boolean;
}
