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

### Start development build

From the [root](/) folder in the repository run:

```
yarn dev:mobile
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

See [testing conventions](../.opencode/rules/testing.mdc) and [connected Android instrumentation](../gears/README.md#native-android-integration).
