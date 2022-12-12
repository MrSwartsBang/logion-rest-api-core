import "./inversify.decorate.js";
import { OpenAPIV3 } from 'express-oas-generator';
import { Container } from 'inversify';
import { schemas } from './ApiTypes.js';
import { AuthenticationController, fillInSpecForAuthenticationController } from './AuthenticationController.js';
import { AuthenticationService } from './AuthenticationService.js';
import { AuthenticationSystemFactory } from './AuthenticationSystemFactory.js';
import { addSchema } from './OpenApi.js';
import { SessionFactory, SessionRepository } from './SessionServices.js';
import { Dino } from "dinoloop";
import { ApplicationErrorController } from "./ApplicationErrorController.js";
import { JsonResponse } from "./JsonResponse.js";
import { PolkadotService } from "./PolkadotService.js";
import { fillInSpecForHealthController, HealthController } from "./HealthController.js";

export function configureContainer(container: Container) {
    container.bind(SessionRepository).toSelf();
    container.bind(SessionFactory).toSelf();

    container.bind(AuthenticationService).toSelf();
    container.bind(AuthenticationSystemFactory).toSelf();
    container.bind(PolkadotService).toSelf();

    container.bind(ApplicationErrorController).toSelf().inTransientScope();
    container.bind(AuthenticationController).toSelf().inTransientScope();
    container.bind(HealthController).toSelf().inTransientScope();
}

export function configureOpenApi(spec: OpenAPIV3.Document) {
    fillInSpecForAuthenticationController(spec);
    fillInSpecForHealthController(spec);

    Object.keys(schemas).forEach(schemaName =>
        addSchema(spec, schemaName, schemas[schemaName]));
}

export function configureDinoloop(dino: Dino) {
    dino.registerController(AuthenticationController);
    dino.registerController(HealthController);
    dino.registerApplicationError(ApplicationErrorController);
    dino.requestEnd(JsonResponse);
}
