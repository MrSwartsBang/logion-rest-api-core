import { injectable } from 'inversify';
import { RequestEndMiddleware } from 'dinoloop';
import { Request, Response, NextFunction } from 'express';

@injectable()
export class JsonResponse extends RequestEndMiddleware {
    invoke(_request: Request, response: Response, _next: NextFunction, result: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
        response.json(result);
    }
}