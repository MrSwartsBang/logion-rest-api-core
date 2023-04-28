import { ValidAccountId, LogionNodeApiClass } from "@logion/node-api";
import { ApiPromise } from "@polkadot/api";

export function mockLogionNodeApi(): LogionNodeApiClass {
    const api = {
        createType() {
            return;
        }
    } as unknown as ApiPromise;
    return new LogionNodeApiClass(api);
}

export function validAccountId(address: string): ValidAccountId {
    return mockLogionNodeApi().queries.getValidAccountId(address, "Polkadot");
}
