# logion-rest-api-core

This library provides the core functionlities that all logion REST-based off-chain services have in common:

- The Authentication controller exposing the REST resources for authentication
- A service maintaining a singleton connection to a logion node
- OpenAPI helpers
- TypeORM helpers
- Dinoloop helpers
- Inversify helpers
- Test helpers
- Various utilities

## Usage

### Configuring OpenAPI

Below call adds the authentication-related elements to an OpenAPI V3 document.

```typescript
const spec: OpenAPIV3.Document = ...;
configureOpenApi(spec);
```

### Configure Dinoloop

Below call registers the authentication controller as well as the default application error controller
and a JSON response middleware.

```typescript
const dino: Dino = ...;
configureDinoloop(dino);
```

### Configure Inversify

Below call binds all provided services in the container.

```typescript
const container: Container = ...;
configureContainer(container);
```

### TypeORM

Simply import the app's data source:

```typescript
import { appDataSource } from "@logion/rest-api-core";
```

The returned data source is configured using `ormconfig.json` file and `TYPEORM_*` environment variables.
This is essentially a re-implementation of the way TypeORM used to be configured before the introduction
of the multiple data source feature.

The returned data source is ready to be used with a transaction context. `DefaultTransactional` method
decorator can be used to set a transaction context with default settings. `typeorm-transactional`'s
`Transactional` decorator may also be used safely.
