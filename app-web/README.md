# Web application

Web version of the application.

## Import sequence

See [ARCHITECTURES](/docs/ARCHITECTURES.md).

## Dependencies

- [TypeScript v5](https://www.typescriptlang.org/)
- [Node v24](https://nodejs.org/en/download)
- [React v19](https://react.dev)
- [RxJS v7](https://rxjs.dev)
- [Mocha v11](https://mochajs.org) for unit tests
- [Cypress](https://www.cypress.io) for E2E tests
- [MapLibreGL v5](https://maplibre.org/maplibre-gl-js/docs)

### React compiler

[React compiler](https://react.dev/learn/react-compiler) is enabled for the whole project and set up according to [Rspack's documentation](https://rspack.dev/guide/tech/react#react-compiler).

## Development

### Start development build

From [root](/) folder in the repository run:

```
yarn dev:web
```

### Preview production build

From [root](/) folder in the repository run:

```
yarn build:web
yarn start:web
```

### Production build and deployment

- [Dockerfile](/app-web/app/Dockerfile)
- [nginx.conf](/app-web/app/conf/conf.d/nginx.conf)
- [build-and-push workflow](/.github/workflows/build-and-push.yaml)

To run docker image locally from root of the repository:

```
docker build . --file /web/app/Dockerfile -t machine-ward
docker run -p 8080:8080 machine-ward
```

Visit [http://localhost:8080](http://localhost:8080).

### Web UI

At the moment a separate deployment of UI library does not exist. It might be added later.

## Tests

### Unit tests

Run `yarn test:web` from the repository root for common and web workspace unit tests. This composition-only app currently has browser tests below, not a separate unit suite. Add a workspace Mocha command when introducing real tests in `test/**/*.test.ts`.

### E2E tests

Write application flow tests using Cypress in `cypress/e2e/**/*.cy.ts`. Shared UI tests belong in `ui/web/cypress/e2e`; see [web checks and CI parity](../docs/CONTRIBUTING.md#web-checks-and-ci-parity).

Run: 

```
yarn test:e2e --browser chrome
```

Using localhost:

```
yarn test:e2e:dev --browser chrome
```

Using current production deployment:

```
yarn test:e2e:prod --browser chrome
```
