import { getEnvConfig, getFileConfig } from "../src/DataSourceProvider.js";

describe("DataSourceProvider", () => {

    it("reads options from env", () => {
        process.env.TYPEORM_CONNECTION = "postgres";
        process.env.TYPEORM_HOST = "localhost";
        process.env.TYPEORM_USERNAME = "postgres";
        process.env.TYPEORM_PASSWORD = "secret";
        process.env.TYPEORM_DATABASE = "postgres";
        process.env.TYPEORM_PORT = "5432";
        process.env.TYPEORM_SYNCHRONIZE = "false";
        process.env.TYPEORM_ENTITIES = "dist/model/*.model.js";
        process.env.TYPEORM_MIGRATIONS = "dist/migration/*.js";

        const options = getEnvConfig();
        expect(options.synchronize).toBe(false);
    });

    it("reads options from file", () => {
        const options = getFileConfig("test/ormconfig.json");
        expect(options.synchronize).toBe(false);
    });
});
