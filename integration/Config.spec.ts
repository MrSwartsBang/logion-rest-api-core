import { DataSource } from "typeorm";
import { LogionNamingStrategy, SessionAggregateRoot, getEnvConfig } from "../src/index.js";

describe("Config", () => {

    it("no sync if requested", async () => {
        process.env.TYPEORM_CONNECTION = "postgres";
        process.env.TYPEORM_HOST = "localhost";
        process.env.TYPEORM_USERNAME = "postgres";
        process.env.TYPEORM_PASSWORD = "secret";
        process.env.TYPEORM_DATABASE = "postgres";
        process.env.TYPEORM_PORT = "5432";
        process.env.TYPEORM_SYNCHRONIZE = "false";

        const options = getEnvConfig();
        options.namingStrategy = new LogionNamingStrategy();
        options.entities = [ SessionAggregateRoot ];

        const dataSource = new DataSource(options);
        await dataSource.initialize();

        const queryRunner = dataSource.createQueryRunner();
        const tables = await queryRunner.getTables();
        expect(tables.find(table => table.name === "session")).toBeUndefined();
    });
});
