import { injectable } from 'inversify';
import { ApiController, Controller, Async, HttpGet } from 'dinoloop';
import { OpenAPIV3 } from 'express-oas-generator';
import { addTag, getDefaultResponses, setControllerTag } from './OpenApi.js';
import { AuthenticationService } from './AuthenticationService.js';
import { requireDefined } from './Assertions.js';

export function fillInSpecForHealthController(spec: OpenAPIV3.Document): void {
    const tagName = 'Health';
    addTag(spec, {
        name: tagName,
        description: "Health checks"
    });
    setControllerTag(spec, /^\/api\/health.*/, tagName);

    HealthController.healthCheck(spec);
}

export abstract class HealthService {

    abstract checkHealth(): Promise<void>;
}

@injectable()
@Controller('/health')
export class HealthController extends ApiController {

    constructor(
        private authenticationService: AuthenticationService,
        private healthService: HealthService,
    ) {
        super();
        this.healthCheckToken = process.env.HEALTH_TOKEN;
    }

    private readonly healthCheckToken: string | undefined;

    static healthCheck(spec: OpenAPIV3.Document) {
        const operationObject = requireDefined(spec.paths["/api/health"].get);
        operationObject.summary = "Tells the status of the backend";
        operationObject.description = "The request is authenticated with a token";
        operationObject.responses = getDefaultResponses();
    }

    @HttpGet('')
    @Async()
    async healthCheck() {
        this.authenticationService.ensureAuthorizationBearer(this.request, this.healthCheckToken);
        await this.healthService.checkHealth();
    }
}
