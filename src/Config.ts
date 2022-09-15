import "./inversify.decorate";
import { OpenAPIV3 } from 'express-oas-generator';
import { Container } from 'inversify';
import { schemas } from './ApiTypes';
import { AuthenticationController, fillInSpec } from './AuthenticationController';
import { AuthenticationService } from './AuthenticationService';
import { AuthenticationSystemFactory } from './AuthenticationSystemFactory';
import { addSchema } from './OpenApi';
import { SessionFactory, SessionRepository } from './SessionServices';
import { Dino } from "dinoloop";
import { ApplicationErrorController } from "./ApplicationErrorController";
import { JsonResponse } from "./JsonResponse";
import { PolkadotService } from "./PolkadotService";

export function configureContainer(container: Container) {
    container.bind(SessionRepository).toSelf();
    container.bind(SessionFactory).toSelf();

    container.bind(AuthenticationService).toSelf();
    container.bind(AuthenticationSystemFactory).toSelf();
    container.bind(PolkadotService).toSelf();

    container.bind(ApplicationErrorController).toSelf().inTransientScope();
    container.bind(AuthenticationController).toSelf().inTransientScope();
}

export function configureOpenApi(spec: OpenAPIV3.Document) {
    fillInSpec(spec);

    Object.keys(schemas).forEach(schemaName =>
        addSchema(spec, schemaName, schemas[schemaName]));
}

export function configureDinoloop(dino: Dino) {
    dino.registerController(AuthenticationController);
    dino.registerApplicationError(ApplicationErrorController);
    dino.requestEnd(JsonResponse);
}
