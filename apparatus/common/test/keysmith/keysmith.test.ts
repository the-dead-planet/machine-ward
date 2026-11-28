import { expect } from "chai";
import { describe, it } from "mocha";
import { BehaviorSubject, of } from "rxjs";
import { getKeyBindingLabels, Keysmith, ShortcutDefinition, ShortcutRegistration } from "../../src/machine-ward/keysmith";

describe("Keysmith", () => {
    it("formats arrow combinations and all registered modifiers without exposing browser key names", () => {
        expect(getKeyBindingLabels({ key: "ArrowLeft" })).to.deep.equal(["←"]);
        expect(getKeyBindingLabels({ key: "ArrowRight", control: true })).to.deep.equal(["Ctrl", "→"]);
        expect(getKeyBindingLabels({ key: "+", shift: true })).to.deep.equal(["Shift", "+"]);
        expect(getKeyBindingLabels({ key: "k", alt: true, shift: true, meta: true })).to.deep.equal(["Alt", "Shift", "Meta", "K"]);
    });

    it("lists translated shortcut definitions and removes only the disposed registration", () => {
        const keysmith = new Keysmith();
        let definitions: readonly ShortcutDefinition[] = [];
        const subscription = keysmith.shortcuts$.subscribe((value) => definitions = value);
        const first: ShortcutRegistration = {
            id: "route.move-backward",
            label: { n: "route", t: "move-backward-label" },
            description: { n: "route", t: "move-backward" },
            binding: { key: "ArrowLeft" },
            allowRepeat: true,
            availability$: of(true),
            execute: () => {},
        };
        const unregister = keysmith.register(first);
        keysmith.register({ ...first, id: "route.move-forward", binding: { key: "ArrowRight" } });
        expect(definitions.map(({ id }) => id)).to.deep.equal(["route.move-backward", "route.move-forward"]);
        expect(definitions[0].description).to.deep.equal({ n: "route", t: "move-backward" });
        expect(definitions[0].label).to.deep.equal({ n: "route", t: "move-backward-label" });
        expect(definitions[0].binding).to.deep.equal({ key: "ArrowLeft" });
        expect(definitions[0].allowRepeat).to.equal(true);
        unregister();
        unregister();
        expect(definitions.map(({ id }) => id)).to.deep.equal(["route.move-forward"]);
        keysmith.cleanUp();
        expect(definitions).to.deep.equal([]);
        subscription.unsubscribe();
    });

    it("matches exact modifiers, reads current availability, and repeats only when allowed", () => {
        const keysmith = new Keysmith();
        const availability$ = new BehaviorSubject(false);
        const presence$ = new BehaviorSubject(true);
        let active: boolean | undefined;
        let present: boolean | undefined;
        const subscription = keysmith.shortcuts$.subscribe(([shortcut]) => {
            active = shortcut?.active;
            present = shortcut?.present;
        });
        let calls = 0;
        const shortcut: ShortcutRegistration = {
            id: "route.move-forward",
            label: { n: "route", t: "move-forward-label" },
            description: { n: "route", t: "move-forward" },
            binding: { key: "ArrowRight", control: true },
            availability$,
            presence$,
            execute: () => calls++,
        };
        const unregister = keysmith.register(shortcut);
        expect(keysmith.handleKey({ key: "ArrowRight", control: true })).to.equal(false);
        expect(active).to.equal(false);
        expect(present).to.equal(true);
        availability$.next(true);
        expect(active).to.equal(true);
        presence$.next(false);
        expect(active).to.equal(false);
        expect(present).to.equal(false);
        expect(keysmith.handleKey({ key: "ArrowRight", control: true })).to.equal(false);
        presence$.next(true);
        for (const binding of [
            { key: "ArrowRight" },
            { key: "ArrowLeft", control: true },
            { key: "ArrowRight", control: true, shift: true },
            { key: "ArrowRight", control: true, alt: true },
            { key: "ArrowRight", control: true, meta: true },
        ]) {
            expect(keysmith.handleKey(binding)).to.equal(false);
        }
        expect(keysmith.handleKey({ key: "ArrowRight", control: true }, true)).to.equal(false);
        expect(calls).to.equal(0);
        expect(keysmith.handleKey({ key: "ArrowRight", control: true })).to.equal(true);
        expect(calls).to.equal(1);
        unregister();
        expect(availability$.observed).to.equal(false);
        keysmith.register({ ...shortcut, allowRepeat: true });
        expect(keysmith.handleKey({ key: "arrowright", control: true }, true)).to.equal(true);
        expect(calls).to.equal(2);
        availability$.next(false);
        expect(active).to.equal(false);
        expect(keysmith.handleKey({ key: "ArrowRight", control: true })).to.equal(false);
        keysmith.cleanUp();
        expect(availability$.observed).to.equal(false);
        subscription.unsubscribe();
    });

    it("does not execute ambiguous bindings or let stale cleanup remove a new registration", () => {
        const keysmith = new Keysmith();
        const calls: string[] = [];
        const secondAvailability$ = new BehaviorSubject(true);
        const first: ShortcutRegistration = {
            id: "first",
            label: { n: "test", t: "first-label" },
            description: { n: "test", t: "first" },
            binding: { key: "ArrowLeft" },
            availability$: of(true),
            execute: () => calls.push("first"),
        };
        const unregister = keysmith.register(first);
        expect(() => keysmith.register(first)).to.throw("Shortcut already registered: first");
        keysmith.register({
            ...first,
            id: "second",
            availability$: secondAvailability$,
            execute: () => calls.push("second"),
        });
        expect(keysmith.handleKey({ key: "ArrowLeft" })).to.equal(false);
        expect(calls).to.deep.equal([]);
        secondAvailability$.next(false);
        expect(keysmith.handleKey({ key: "ArrowLeft" })).to.equal(true);
        expect(calls).to.deep.equal(["first"]);
        keysmith.cleanUp();
        keysmith.register(first);
        unregister();
        expect(keysmith.handleKey({ key: "ArrowLeft" })).to.equal(true);
        expect(calls).to.deep.equal(["first", "first"]);
    });
});
