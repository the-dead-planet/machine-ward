import { BehaviorSubject, combineLatest, of, Subscription } from "rxjs";
import { KeyBinding, ShortcutRegistration, ShortcutStatus } from "./model";

/**
 * Machine Ward's platform-neutral registry and dispatcher for keyboard shortcuts.
 */
export class Keysmith {
    private readonly registrations = new Map<string, { shortcut: ShortcutStatus; execute: () => void; subscription: Subscription }>();
    private readonly definitions$ = new BehaviorSubject<readonly ShortcutStatus[]>([]);
    /**
     * Snapshots of all registered shortcuts, including those not currently present or active.
     */
    public readonly shortcuts$ = this.definitions$.asObservable();

    /**
     * Register a unique shortcut ID and return an idempotent disposer. Owner call it on disengage or teardown.
     */
    public register = ({ presence$ = of(true), availability$, execute, ...definition }: ShortcutRegistration): (() => void) => {
        if (this.registrations.has(definition.id)) {
            throw new Error(`Shortcut already registered: ${definition.id}`);
        }
        const registration = {
            shortcut: { ...definition, binding: { ...definition.binding }, present: false, active: false },
            execute,
            subscription: new Subscription(),
        };
        this.registrations.set(definition.id, registration);
        registration.subscription.add(combineLatest([presence$, availability$]).subscribe(([present, available]) => {
            const active = present && available;
            if (registration.shortcut.present !== present || registration.shortcut.active !== active) {
                registration.shortcut = { ...registration.shortcut, present, active };
                this.publishDefinitions();
            }
        }));
        this.publishDefinitions();

        return () => {
            if (this.registrations.get(definition.id) === registration) {
                registration.subscription.unsubscribe();
                this.registrations.delete(definition.id);
                this.publishDefinitions();
            }
        };
    };

    /**
     * Run the sole active match with exact modifiers; return false for no match or an ambiguous binding.
     */
    public handleKey = (binding: KeyBinding, repeated = false): boolean => {
        const matches = [...this.registrations.values()].filter(({ shortcut }) =>
            shortcut.binding.key.toLowerCase() === binding.key.toLowerCase() &&
            !!shortcut.binding.control === !!binding.control &&
            !!shortcut.binding.shift === !!binding.shift &&
            !!shortcut.binding.alt === !!binding.alt &&
            !!shortcut.binding.meta === !!binding.meta &&
            (!repeated || shortcut.allowRepeat) &&
            shortcut.active,
        );
        if (matches.length !== 1) {
            return false;
        }
        matches[0].execute();
        return true;
    };

    /**
     * Remove every registration and unsubscribe from its status streams.
     */
    public cleanUp = (): void => {
        for (const { subscription } of this.registrations.values()) {
            subscription.unsubscribe();
        }
        this.registrations.clear();
        this.publishDefinitions();
    };

    /**
     *
     */
    private publishDefinitions = (): void => {
        this.definitions$.next([...this.registrations.values()].map(({ shortcut }) => shortcut));
    };
}
