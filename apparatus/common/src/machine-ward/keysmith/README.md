# Keysmith

Machine Ward owns one Keysmith, exposed through `useWebMachineWard().keysmith`,
`useMobileMachineWard().keysmith`, and each gear's apparatus.

| API | Purpose |
| --- | --- |
| `register(shortcut)` | Register a stable, namespaced action ID; returns its cleanup function. Duplicate IDs throw. |
| `shortcuts$` | Observable list of registered IDs, translated descriptions, bindings, and repeat policies for help UI. |
| `handleKey(binding, repeated)` | Execute exactly one available match; return whether the key was handled. Ambiguous matches execute nothing. |

Register in an effect and return its cleanup function. `isAvailable()` reads current
application state; it must not change state. Modifiers match exactly. Key repeat is
off unless `allowRepeat` is enabled.

The web app mounts `useKeysmithKeyboard()` once. It respects handled events and
text composition. Page shortcuts apply only on the page body, the map canvas, or
an element explicitly marked `data-keysmith-target`, never inside dialogs.
Focused controls keep their own keys. On the map canvas, a handled shortcut takes
precedence over MapLibre keyboard navigation; unhandled keys remain native.

The registry is platform-neutral; only the web adapter listens to browser events.
Shortcut settings, persistence, rebinding, and help UI are not implemented yet.
