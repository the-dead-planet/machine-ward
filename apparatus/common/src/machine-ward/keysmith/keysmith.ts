import { BehaviorSubject } from "rxjs";
import { KeyBinding, ShortcutDefinition, ShortcutRegistration } from "./model";

export class Keysmith {
    private readonly registrations = new Map<string, ShortcutRegistration>();
    private readonly definitions$ = new BehaviorSubject<readonly ShortcutDefinition[]>([]);
    public readonly shortcuts$ = this.definitions$.asObservable();

    public register = (shortcut: ShortcutRegistration): (() => void) => {
        if (this.registrations.has(shortcut.id)) {
            throw new Error(`Shortcut already registered: ${shortcut.id}`);
        }
        const registration: ShortcutRegistration = {
            ...shortcut,
            binding: { ...shortcut.binding },
        };
        this.registrations.set(shortcut.id, registration);
        this.publishDefinitions();
        return () => {
            if (this.registrations.get(shortcut.id) === registration) {
                this.registrations.delete(shortcut.id);
                this.publishDefinitions();
            }
        };
    };

    public handleKey = (binding: KeyBinding, repeated = false): boolean => {
        const matches = [...this.registrations.values()].filter((shortcut) =>
            shortcut.binding.key.toLowerCase() === binding.key.toLowerCase() &&
            !!shortcut.binding.control === !!binding.control &&
            !!shortcut.binding.shift === !!binding.shift &&
            !!shortcut.binding.alt === !!binding.alt &&
            !!shortcut.binding.meta === !!binding.meta &&
            (!repeated || shortcut.allowRepeat) &&
            shortcut.isAvailable(),
        );
        if (matches.length !== 1) {
            return false;
        }
        matches[0].execute();
        return true;
    };

    public cleanUp = (): void => {
        this.registrations.clear();
        this.publishDefinitions();
    };

    private publishDefinitions = (): void => {
        this.definitions$.next([...this.registrations.values()].map(({ id, description, binding, allowRepeat }) => ({
            id,
            description,
            binding,
            allowRepeat,
        })));
    };
}
