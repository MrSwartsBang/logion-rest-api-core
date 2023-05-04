import { injectable } from 'inversify';
import { buildApiClass, LogionNodeApiClass } from '@logion/node-api';

@injectable()
export class PolkadotService {

    constructor() {
        const endpoint = process.env.WS_PROVIDER_URL || 'ws://localhost:9944';
        this.endpoints = endpoint.split(",");
    }

    async readyApi(): Promise<LogionNodeApiClass> {
        if (this._api === null) {
            this._api = await buildApiClass(this.endpoints);
        }
        return this._api;
    }

    private _api: LogionNodeApiClass | null = null;

    readonly endpoints: string[]

}
