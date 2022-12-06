import "./inversify.decorate";
import { DateTime } from "luxon";
import {
    AuthenticatedUser,
    AuthenticationSystem,
    Authenticator,
    SessionManager,
    AuthorityService
} from '@logion/authenticator';
import express, { Express } from 'express';
import { Dino } from 'dinoloop';
import { Container } from 'inversify';
import { ApplicationErrorController } from './ApplicationErrorController';
import { JsonResponse } from './JsonResponse';
import { Mock } from "moq.ts";
import { AuthenticationService } from "./AuthenticationService";
import { UnauthorizedException } from "dinoloop/modules/builtin/exceptions/exceptions";
import { buildBaseExpress } from "./Express";

export const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
export const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
export const CHARLY = "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y";

export function setupApp<T>(
    controller: Function & { prototype: T; }, // eslint-disable-line @typescript-eslint/ban-types
    mockBinder: (container: Container) => void,
    mock?: AuthenticationServiceMock,
): Express {
    return setupCustomApp(buildBaseExpress, controller, mockBinder, mock);
}

export function setupCustomApp<T>(
    expressFactory: () => Express,
    controller: Function & { prototype: T; }, // eslint-disable-line @typescript-eslint/ban-types
    mockBinder: (container: Container) => void,
    mock?: AuthenticationServiceMock,
): Express {
    const app = expressFactory();
    const dino = new Dino(app, '/api');

    dino.useRouter(() => express.Router());
    dino.registerController(controller);
    dino.registerApplicationError(ApplicationErrorController);
    dino.requestEnd(JsonResponse);

    const container = new Container({ defaultScope: "Singleton" });

    container.bind(AuthenticationService).toConstantValue(mockAuthenticationService(mock ? mock : mockAuthenticationWithCondition(true)));

    mockBinder(container);

    dino.dependencyResolver<Container>(container,
        (injector, type) => {
            return injector.resolve(type);
        });

    dino.bind();

    return app;
}

export interface AuthenticationServiceMock {
    authenticatedUser: () => Promise<AuthenticatedUser>;
    authenticatedUserIs: () => Promise<AuthenticatedUser>;
    authenticatedUserIsOneOf: () => Promise<AuthenticatedUser>;
    nodeOwner: string;
    ensureAuthorizationBearer: () => void;
}

export function mockAuthenticationWithCondition(conditionFulfilled: boolean, address?: string): AuthenticationServiceMock {
    const authenticatedUser = mockAuthenticatedUser(conditionFulfilled, address);
    const ensureAuthorizationBearerMock = () => {
        if (!conditionFulfilled) {
            throw new UnauthorizedException();
        }
    };
    return mockAuthenticationWithAuthenticatedUser(authenticatedUser, ensureAuthorizationBearerMock);
}

export function mockAuthenticationWithAuthenticatedUser(authenticatedUser: AuthenticatedUser, ensureAuthorizationBearer?: () => void): AuthenticationServiceMock {
    return {
        authenticatedUser: () => Promise.resolve(authenticatedUser),
        authenticatedUserIs: throwOrReturn(authenticatedUser.is(null), authenticatedUser),
        authenticatedUserIsOneOf: throwOrReturn(authenticatedUser.isOneOf([]), authenticatedUser),
        nodeOwner: ALICE,
        ensureAuthorizationBearer: ensureAuthorizationBearer ? ensureAuthorizationBearer : () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
    };
}

function throwOrReturn(condition: boolean, authenticatedUser: AuthenticatedUser): () => Promise<AuthenticatedUser> {
    return () => {
        if(condition) {
            return Promise.resolve(authenticatedUser);
        } else {
            throw new UnauthorizedException();
        }
    };
}

export function mockAuthenticationForUserOrLegalOfficer(isLegalOfficer: boolean, address?: string) {
    const authenticatedUser = new Mock<AuthenticatedUser>();
    authenticatedUser.setup(instance => instance.address).returns(address || ALICE);
    authenticatedUser.setup(instance => instance.is).returns(() => true);
    authenticatedUser.setup(instance => instance.isOneOf).returns(() => true);
    authenticatedUser.setup(instance => instance.require).returns((predicate) => {
        if(!predicate(authenticatedUser.object())) {
            throw new UnauthorizedException();
        } else {
            return authenticatedUser.object();
        }
    });
    authenticatedUser.setup(instance => instance.isNodeOwner()).returns(isLegalOfficer);
    authenticatedUser.setup(instance => instance.isLegalOfficer()).returnsAsync(isLegalOfficer);
    authenticatedUser.setup(instance => instance.requireLegalOfficerOnNode).returns(() => {
        if (isLegalOfficer) {
            return Promise.resolve(authenticatedUser.object())
        } else {
            throw new UnauthorizedException();
        }
    })
    return mockAuthenticationWithAuthenticatedUser(authenticatedUser.object());
}

function mockAuthenticationService(mock: AuthenticationServiceMock): AuthenticationService {
    const authenticationSystem = mockAuthenticationSystem(mock);
    const authenticationService = new Mock<AuthenticationService>();
    authenticationService.setup(instance => instance.authenticationSystem()).returnsAsync(authenticationSystem);
    authenticationService.setup(instance => instance.authenticatedUserIs).returns(mock.authenticatedUserIs);
    authenticationService.setup(instance => instance.authenticatedUserIsOneOf).returns(mock.authenticatedUserIsOneOf);
    authenticationService.setup(instance => instance.authenticatedUser).returns(mock.authenticatedUser);
    authenticationService.setup(instance => instance.authenticatedUserIsLegalOfficerOnNode).returns(mock.authenticatedUser);
    authenticationService.setup(instance => instance.nodeOwner).returns(mock.nodeOwner);
    authenticationService.setup(instance => instance.ensureAuthorizationBearer).returns(mock.ensureAuthorizationBearer);
    return authenticationService.object();
}

export function mockAuthenticatedUser(conditionFulfilled: boolean, address?: string): AuthenticatedUser {
    const authenticatedUser = new Mock<AuthenticatedUser>();
    authenticatedUser.setup(instance => instance.address).returns(address ? address : ALICE);
    authenticatedUser.setup(instance => instance.is).returns(() => conditionFulfilled);
    authenticatedUser.setup(instance => instance.isOneOf).returns(() => conditionFulfilled);
    authenticatedUser.setup(instance => instance.require).returns((predicate) => {
        if(!predicate(authenticatedUser.object())) {
            throw new UnauthorizedException();
        } else {
            return authenticatedUser.object();
        }
    });
    authenticatedUser.setup(instance => instance.isNodeOwner).returns(() => conditionFulfilled);
    authenticatedUser.setup(instance => instance.isLegalOfficer()).returnsAsync(conditionFulfilled);
    authenticatedUser.setup(instance => instance.requireLegalOfficerOnNode).returns(() => {
        if (address === ALICE) {
            return Promise.resolve(authenticatedUser.object());
        } else {
            throw new UnauthorizedException();
        }
    });
    return authenticatedUser.object();
}

function mockAuthenticationSystem(mock: AuthenticationServiceMock): AuthenticationSystem {
    const sessionManager = new Mock<SessionManager>();
    sessionManager.setup(instance => instance.createNewSession).returns(addresses => ({
        addresses,
        id: "testSessionId",
        createdOn: DateTime.now(),
    }));

    const authenticator = new Mock<Authenticator>();
    authenticator.setup(instance => instance.ensureAuthenticatedUserOrThrow).returns(() => mock.authenticatedUser());

    const authorityService: AuthorityService = {
        isLegalOfficer(): Promise<boolean> {
            return Promise.resolve(true);
        },
        isLegalOfficerNode(): Promise<boolean> {
            return Promise.resolve(true);
        },
        isLegalOfficerOnNode(): Promise<boolean> {
            return Promise.resolve(false);
        }
    }
    return {
        sessionManager: sessionManager.object(),
        authenticator: authenticator.object(),
        authorityService,
    };
}

