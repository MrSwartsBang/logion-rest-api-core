import { injectable } from 'inversify';
import { ErrorController } from 'dinoloop';

import { Log } from "./Logging";
import { errorPayload } from './Errors';

const { logger } = Log;

@injectable()
export class ApplicationErrorController extends ErrorController {
    internalServerError(): void {
        logger.error(this.error.message);
        logger.error(this.error.stack);
        this.response
            .status(500)
            .json(errorPayload(
                '500 Internal Server Error',
                this.error.message,
                this.error.stack
            ));
    }
}
