# Keysmith

Machine Ward owns one Keysmith, exposed through `useWebMachineWard().keysmith`,
`useMobileMachineWard().keysmith`, and each gear's apparatus.

| API | Purpose |
| --- | --- |
| `register(shortcut)` | Register a stable, namespaced action ID; returns its cleanup function. Duplicate IDs throw. |
| `shortcuts$` | Observable list of registered IDs, translated labels, descriptions, hints, bindings, and repeat policies. |
| `handleKey(binding, repeated)` | Execute exactly one available match; return whether the key was handled. Ambiguous matches execute nothing. |

Dispose registrations when their owner is removed. `presence$` supplies context status
for the overview (defaults to present); dispatch also requires `availability$`.
Use `requirements` to explain how to make the shortcut usable. Set `owner` to the
gear's translated name; omit it for Machine Ward shortcuts. Modifiers match exactly. Key repeat is
off unless `allowRepeat` is enabled.

The web app mounts `useKeysmithKeyboard()` once. It respects handled events and
text composition. Page shortcuts apply only on the page body, the map canvas, or
an element explicitly marked `data-keysmith-target`, never inside dialogs.
Focused controls keep their own keys. On the map canvas, a handled shortcut takes
precedence over MapLibre keyboard navigation; unhandled keys remain native.

The registry is platform-neutral; only the web adapter listens to browser events.
The web application menu lists registered shortcuts in a dialog, including
shortcuts whose context is not currently available. Each definition includes a
short `label`, an explanatory `description`, and an actionable `hint` reserved
for future contextual toolbar guidance. Hints are not rendered yet.

Shortcut settings, persistence, and rebinding are not implemented yet.
