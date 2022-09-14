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
