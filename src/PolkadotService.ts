import { injectable } from 'inversify';
import { buildApi, LogionNodeApi, Queries } from '@logion/node-api';

@injectable()
export class PolkadotService {

    async readyApi(): Promise<LogionNodeApi> {
        if (this._api === null) {
            this._api = await buildApi(process.env.WS_PROVIDER_URL || 'ws://localhost:9944');
        }
        return this._api;
    }

    private _api: LogionNodeApi | null = null;

    async queries(): Promise<Queries> {
        return Queries.of(this.readyApi());
    }
}
