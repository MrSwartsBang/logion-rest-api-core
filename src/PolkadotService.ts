import { injectable } from 'inversify';
import { buildApiClass, LogionNodeApiClass } from '@logion/node-api';

@injectable()
export class PolkadotService {

    async readyApi(): Promise<LogionNodeApiClass> {
        if (this._api === null) {
            this._api = await buildApiClass(process.env.WS_PROVIDER_URL || 'ws://localhost:9944');
        }
        return this._api;
    }

    private _api: LogionNodeApiClass | null = null;
}
