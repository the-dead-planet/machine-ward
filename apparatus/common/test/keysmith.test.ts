import { expect } from "chai";
import { describe, it } from "mocha";
import { Keysmith, ShortcutDefinition, ShortcutRegistration } from "../src/machine-ward/keysmith";

describe("Keysmith", () => {
    it("lists translated shortcut definitions and removes only the disposed registration", () => {
        const keysmith = new Keysmith();
        let definitions: readonly ShortcutDefinition[] = [];
        const subscription = keysmith.shortcuts$.subscribe((value) => definitions = value);
        const first: ShortcutRegistration = {
            id: "route.move-backward",
            description: { n: "route", t: "move-backward" },
            binding: { key: "ArrowLeft" },
            allowRepeat: true,
            isAvailable: () => true,
            execute: () => {},
        };
        const unregister = keysmith.register(first);
        keysmith.register({ ...first, id: "route.move-forward", binding: { key: "ArrowRight" } });
        expect(definitions.map(({ id }) => id)).to.deep.equal(["route.move-backward", "route.move-forward"]);
        expect(definitions[0].description).to.deep.equal({ n: "route", t: "move-backward" });
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
        let available = false;
        let calls = 0;
        const shortcut: ShortcutRegistration = {
            id: "route.move-forward",
            description: { n: "route", t: "move-forward" },
            binding: { key: "ArrowRight", control: true },
            isAvailable: () => available,
            execute: () => calls++,
        };
        const unregister = keysmith.register(shortcut);
        expect(keysmith.handleKey({ key: "ArrowRight", control: true })).to.equal(false);
        available = true;
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
        keysmith.register({ ...shortcut, allowRepeat: true });
        expect(keysmith.handleKey({ key: "arrowright", control: true }, true)).to.equal(true);
        expect(calls).to.equal(2);
    });

    it("does not execute ambiguous bindings or let stale cleanup remove a new registration", () => {
        const keysmith = new Keysmith();
        const calls: string[] = [];
        let secondAvailable = true;
        const first: ShortcutRegistration = {
            id: "first",
            description: { n: "test", t: "first" },
            binding: { key: "ArrowLeft" },
            isAvailable: () => true,
            execute: () => calls.push("first"),
        };
        const unregister = keysmith.register(first);
        expect(() => keysmith.register(first)).to.throw("Shortcut already registered: first");
        keysmith.register({
            ...first,
            id: "second",
            isAvailable: () => secondAvailable,
            execute: () => calls.push("second"),
        });
        expect(keysmith.handleKey({ key: "ArrowLeft" })).to.equal(false);
        expect(calls).to.deep.equal([]);
        secondAvailable = false;
        expect(keysmith.handleKey({ key: "ArrowLeft" })).to.equal(true);
        expect(calls).to.deep.equal(["first"]);
        keysmith.cleanUp();
        keysmith.register(first);
        unregister();
        expect(keysmith.handleKey({ key: "ArrowLeft" })).to.equal(true);
        expect(calls).to.deep.equal(["first", "first"]);
    });
});
