import { Session, SessionSignature, Token } from "@logion/authenticator";
import { Controller, ApiController, HttpPost, Async, HttpPut } from "dinoloop";
import { OpenAPIV3 } from "express-oas-generator";
import { injectable } from "inversify";
import { DateTime } from "luxon";

import { AuthenticationService } from "./AuthenticationService.js";
import { SessionRepository, SessionFactory } from "./SessionServices.js";
import { requireDefined } from "./Assertions.js";
import {
    getRequestBody,
    getBodyContent,
    getDefaultResponses,
    setPathParameters,
    addTag,
    setControllerTag
} from "./OpenApi.js";
import { unauthorized } from "./AuthenticationSystemFactory.js";
import { AuthenticateRequestView, AuthenticateResponseView, RefreshRequestView, SignInRequestView, SignInResponseView, TokenView } from "./ApiTypes.js";

import { Log } from './Logging.js';
import { ValidAccountId } from "@logion/node-api";
import { PolkadotService } from "./PolkadotService.js";
import { UnauthorizedException } from "dinoloop/modules/builtin/exceptions/exceptions.js";
const { logger } = Log;

export function fillInSpecForAuthenticationController(spec: OpenAPIV3.Document): void {
    const tagName = 'Authentication';
    addTag(spec, {
        name: tagName,
        description: "Handling of session authentication"
    });
    setControllerTag(spec, /^\/api\/auth.*/, tagName);

    AuthenticationController.signIn(spec);
    AuthenticationController.authenticate(spec);
}

@injectable()
@Controller('/auth')
export class AuthenticationController extends ApiController {

    static readonly RESOURCE = "authentication";

    constructor(
        private sessionRepository: SessionRepository,
        private sessionFactory: SessionFactory,
        private authenticationService: AuthenticationService,
        private polkadotService: PolkadotService) {
        super();
    }

    static signIn(spec: OpenAPIV3.Document) {
        const operationObject = requireDefined(spec.paths["/api/auth/sign-in"].post);
        operationObject.summary = "Sign-in for a new session";
        operationObject.description = "No signature required";
        operationObject.requestBody = getRequestBody({
            description: "Session creation data",
            view: "SignInRequestView"
        })
        operationObject.responses = {"200": {
            description: "OK",
            content: getBodyContent("SignInResponseView"),
        }};
    }

    @HttpPost('/sign-in')
    @Async()
    async signIn(signInRequest: SignInRequestView): Promise<SignInResponseView> {
        const { sessionManager } = await this.authenticationService.authenticationSystem();
        const session = sessionManager.createNewSession(requireDefined(signInRequest.addresses));
        for(const address of session.addresses) {
            const sessionAggregate = this.sessionFactory.newSession({
                account: await this.toAccount(address),
                sessionId: session.id,
                createdOn: session.createdOn,
            });
            await this.sessionRepository.save(sessionAggregate);
        }
        return Promise.resolve({ sessionId: session.id });
    }

    private async toAccount(address: string): Promise<ValidAccountId> {
        try {
            const api = await this.polkadotService.readyApi();
            return ValidAccountId.parseKey(api.polkadot, address);
        } catch (error) {
            throw new UnauthorizedException({ error: "" + error });
        }
    }

    static authenticate(spec: OpenAPIV3.Document) {
        const operationObject = requireDefined(spec.paths["/api/auth/{sessionId}/authenticate"].post);
        operationObject.summary = "Authenticate the given session";
        operationObject.description = "<p>The signature's resource is <code>authentication</code>, the operation <code>login</code> and the additional field is <code>sessionId</code><p>";
        operationObject.requestBody = getRequestBody({
            description: "Authentication data",
            view: "AuthenticateRequestView",
        });
        operationObject.responses = getDefaultResponses("AuthenticateResponseView");
        setPathParameters(operationObject, { 'sessionId': "The ID of the session to authenticate" });
    }

    @HttpPost('/:sessionId/authenticate')
    @Async()
    async authenticate(
        authenticateRequest: AuthenticateRequestView,
        sessionId: string
    ): Promise<AuthenticateResponseView> {

        const { session, signatures } = await this.sessionAndSignatures(authenticateRequest, sessionId);
        const { sessionManager, authenticator } = await this.authenticationService.authenticationSystem();

        const signedSession = await sessionManager.signedSessionOrThrow(session, signatures);
        const tokens = await authenticator.createTokens(signedSession, DateTime.now());

        return this.toAuthenticateResponseView(tokens);
    }

    private async sessionAndSignatures(
        authenticateRequest: AuthenticateRequestView,
        sessionId: string
    ): Promise<{ session: Session, signatures: SessionSignature[] }> {
        const signatures: SessionSignature[] = [];
        let createdOn: DateTime | undefined;
        for (const address in authenticateRequest.signatures) {
            const account = await this.toAccount(address);
            createdOn = await this.clearSession(account, sessionId);

            const signature = authenticateRequest.signatures[address];
            signatures.push({
                address: account.address,
                signature: requireDefined(signature.signature),
                signedOn: requireDefined(signature.signedOn),
                type: requireDefined(signature.type)
            });
        }
        const session: Session = {
            addresses: Object.keys(signatures),
            createdOn: requireDefined(createdOn),
            id: sessionId,
        };
        return { session, signatures };
    }

    private async clearSession(account: ValidAccountId, sessionId: string): Promise<DateTime> {
        const session = await this.sessionRepository.find(account, sessionId);
        if (session === null) {
            throw unauthorized("Invalid session")
        }
        await this.sessionRepository.delete(session);
        return DateTime.fromJSDate(requireDefined(session.createdOn));
    }

    private toAuthenticateResponseView(tokens: Token[]): AuthenticateResponseView {
        const responseTokens: Record<string, TokenView> = {};
        const response: AuthenticateResponseView = { tokens: responseTokens };
        for (const token of tokens) {
            const key = `${ token.type }:${ token.address }`;
            responseTokens[key] = {
                value: token.value,
                expiredOn: requireDefined(token.expiredOn.toISO({ includeOffset: false })),
            }
        }
        return response;
    }

    @HttpPut('/refresh')
    @Async()
    async refresh(refreshRequest: RefreshRequestView): Promise<AuthenticateResponseView> {
        const { authenticator } = await this.authenticationService.authenticationSystem();
        const responseTokens: Record<string, TokenView> = {};
        const response: AuthenticateResponseView = { tokens: responseTokens };
        for (const address in refreshRequest.tokens) {
            const oldToken = refreshRequest.tokens[address];
            try {
                const refreshedToken = await authenticator.refreshToken(oldToken);
                responseTokens[address] = {
                    value: refreshedToken.value,
                    expiredOn: requireDefined(refreshedToken.expiredOn.toISO({ includeOffset: false })),
                }
            } catch (e) {
                logger.warn("Failed to refresh token for %s: %s", address, e)
            }
        }
        return response;
    }
}
