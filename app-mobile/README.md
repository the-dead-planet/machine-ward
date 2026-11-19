# Mobile application

Mobile version of the application.

## Import sequence

See [ARCHITECTURES](/docs/ARCHITECTURES.md).

## Dependencies

- [TypeScript v5](https://www.typescriptlang.org/)
- [Node v24](https://nodejs.org/en/download)
- [React v19](https://react.dev)
- [React Native v0.83](https://reactnative.dev)
- [RxJS v7](https://rxjs.dev)
- [Mocha v11](https://mochajs.org) for unit tests
- [MapLibre React Native v10](https://maplibre.org/maplibre-react-native)

### React compiler

[React compiler](https://react.dev/learn/react-compiler) is enabled for the whole project and set up according to [official docs](https://react.dev/learn/react-compiler/installation#usage-with-react-native-metro).

### Adding React Native specific dependencies

Add required RN dependencies in this mobile app workspace and also list them as peer dependencies in the other packages or gears workspaces. This is required for linking to work correctly.

### Adding standard dependencies

The standard JS libraries, compatible with both web and mobile, should be installed in the workspace which needs them. 

If it's a package used across the whole project, then it can be installed in root.

## Development

### Java for Android builds

Use **Temurin JDK 25 LTS** to run Gradle 9.4.1 ([supported Java versions](https://docs.gradle.org/9.4.1/userguide/compatibility.html#java_runtime)). Keep JDK 17 installed: React Native's Gradle plugin requests it as a compilation toolchain. CI installs both and runs Gradle with 25; this does not raise Android's Java bytecode target.

On Windows, install 25 in PowerShell:

```powershell
winget install --id EclipseAdoptium.Temurin.25.JDK --exact --source winget
```

Keep your existing JDK 17. Set the user `JAVA_HOME` environment variable to the installed **JDK 25 directory** (not its `bin` directory), and put `%JAVA_HOME%\bin` before older Java entries in `Path`. Reopen terminals. In Android Studio's **Settings → Build, Execution, Deployment → Build Tools → Gradle**, keep **Distribution: Wrapper** and select **Gradle JVM criteria: Version 25 / Eclipse Temurin**. Older versions instead expose a **Gradle JDK** directory selector. The project's Foojay resolver supplies toolchain download repositories.

Verify in a new terminal with `java -version` and `.\app-mobile\android\gradlew.bat -p app-mobile/android --version`; both should report Java 25. If Gradle cannot locate the retained JDK 17, add its local installation directory to `org.gradle.java.installations.paths` in your user `%USERPROFILE%\.gradle\gradle.properties` (use forward slashes in that path), not the repository.

### Start Metro

From the [root](/) folder in the repository run:

```
yarn dev:mobile
```

Leave Metro running while using the debug app or running instrumentation tests. This command does not build, install, or start an emulator.

With a device connected or emulator running, build and install the debug app without clearing its data:

```sh
yarn install:mobile
```

To restart metro server and clear cache

```
yarn dev:mobile:r
```

To run type check in watch mode:

```
yarn typecheck:mobile
```

## Tests

Run `yarn test:mobile` from the repository root for shared and mobile unit/component tests, or `yarn test:native` from this workspace for its Jest tests in `__tests__/`. These exercise JavaScript/native contracts, not a running device app.

### Android instrumentation

Start an emulator in Android Studio's **Device Manager**, or connect an Android device with USB debugging enabled. Wait until it is fully booted. Keep Metro running, then run from the repository root in a second terminal:

```sh
yarn test:instrumentation:mobile
```

Gradle builds and installs the app and test APKs automatically on connected devices; no manual installation is needed. Results are in `android/app/build/reports/androidTests/connected/debug/index.html` and `android/app/build/outputs/androidTest-results/connected/debug/` relative to this workspace.

### Troubleshooting

| Failure | Action |
| --- | --- |
| Missing `jlink.exe` under a VS Code extension | Use a full Temurin JDK, not VS Code's bundled runtime. Set VS Code user settings `java.import.gradle.java.home` and `java.jdt.ls.java.home` to your JDK 25 directory. Keep daemon criteria restricted to Adoptium. Restart editors and stop old daemons with `yarn gradle:stop` from the repository root. |
| JDK detection still selects the wrong installation | Create `%USERPROFILE%\.gradle\gradle.properties` if absent. Set `org.gradle.java.installations.auto-detect=false` and `org.gradle.java.installations.paths` to comma-separated full JDK 25 and 17 directories, using forward slashes. These machine-specific paths do not belong in the repository. |
| No connected devices / device offline | Start the emulator and wait for its home screen. Check `adb devices` for status `device`; use Device Manager's **Cold Boot Now** if it remains offline. |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | Free space inside the emulator. Alternatively stop it and choose **Wipe Data**, which deletes all its apps and data. |
| Could not load test results | Inspect the named XML file for the underlying installation/device error. |

See [testing conventions](../.opencode/rules/testing.mdc) and [native gear integration](../gears/README.md#native-android-integration).

### CI

Android CI caches Gradle dependencies/task outputs and native C++ compilation, then builds both debug APKs before starting the emulator. The first run fills those caches; later runs report Gradle cache use and CCache statistics. Native test reports are uploaded even when assertions fail. Emulator snapshots and whole Android SDK directories are deliberately not cached.
