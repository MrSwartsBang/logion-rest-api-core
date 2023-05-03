import { PolkadotService } from "../src/PolkadotService.js";

describe("PolkadotService", () => {

    it("has default endpoint", () => {
        process.env.WS_PROVIDER_URL = "";
        const p = new PolkadotService();
        expect(p.endpoints).toEqual([ "ws://localhost:9944" ]);
    })

    it("has one provided endpoint", () => {
        process.env.WS_PROVIDER_URL = "ws://node:8844";
        const p = new PolkadotService();
        expect(p.endpoints).toEqual([ "ws://node:8844" ]);
    })

    it("has two provided endpoints", () => {
        process.env.WS_PROVIDER_URL = "wss://rpc01.logion.network,wss://rpc02.logion.network";
        const p = new PolkadotService();
        expect(p.endpoints).toEqual([
            "wss://rpc01.logion.network",
            "wss://rpc02.logion.network",
        ]);
    })
})
