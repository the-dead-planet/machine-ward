# Gears

Pluggable features. Gears can span one or more packages depending on the platforms they target:

| Template | Packages |
|----------|----------|
| `default` | `common/` (abstract `Gear<TMap>`), `web/` (maplibregl.Map), `mobile/` (MobileMap) |
| `web-only` | `web/` (extends `Gear<maplibregl.Map>` directly) |
| `mobile-only` | `mobile/` (extends `Gear<MobileMap>` directly) |

Gears are automatically discovered by the web build — no manual registration needed.

## Native Android integration

Keep gear-specific Kotlin/Java code under `<gear>/mobile/android/src/main/java/<package-path>/`.

- The app's Gradle configuration discovers these source folders automatically; gears without them need no special handling.
- Keep feature implementation in the gear. Activation and Android lifecycle wiring remain explicit in the app's platform entry points, such as `MainActivity`.
- Guard Android API requirements at runtime and clean up native listeners or system overrides when the feature is hidden, removed, or destroyed.
- Discovery includes `src/main/java` and instrumentation tests in `src/androidTest/java`, not native module registration, resources, manifests, or dependencies. Use an Android library module if those are needed.

Kotlin/Java and Gradle changes require rebuilding and reinstalling the mobile app; Metro reload is not sufficient.

See [Android instrumentation](../app-mobile/README.md#android-instrumentation) for device setup, Metro, test commands, and troubleshooting.

## Generating a new gear

```bash
yarn generate:gear                      # will enquire about the details
```

Or provide the name and optional flags right away 

```bash
yarn generate:gear <name>               # common + web + mobile
yarn generate:gear <name> --web-only    # web only (no common)
yarn generate:gear <name> --mobile-only # mobile only (no common)
```

This copies the relevant template from [.templates/](../.templates/), replaces `__name__` / `__PascalName__` placeholders, and links the packages. Run `yarn install` after generating.

## Adding dependencies to a gear

```bash
yarn add:gear <name> <common|web|mobile> <package>
```

Resolves the long workspace name for you:

```bash
yarn add:gear route-story web maplibre-gl
# equivalent to: yarn workspace @the-dead-planet/machine-ward-gears-route-story-web add maplibre-gl

yarn add:gear navigate common -D @types/foo
# equivalent to: yarn workspace @the-dead-planet/machine-ward-gears-navigate-common add -D @types/foo
```
