import { DataSource, DataSourceOptions } from "typeorm";
import { addTransactionalDataSource, deleteDataSourceByName, initializeTransactionalContext, IsolationLevel, Transactional } from 'typeorm-transactional';
import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";

import { LogionNamingStrategy } from "./LogionNamingStrategy.js";
import { SessionAggregateRoot } from "./SessionEntity.js";
import { WrapInTransactionOptions } from "typeorm-transactional/dist/transactions/wrap-in-transaction.js";

dotenv.config();

const CONFIG_FILE = "ormconfig.json";

export let appDataSource = buildDefaultDataSource();

export function buildDefaultDataSource(): DataSource {
    const options = buildDefaultDataSourceOptions();
    const dataSource = new DataSource(options);
    initializeTransactionalContext();
    addTransactionalDataSource(dataSource);
    return dataSource;
}

export function buildDefaultDataSourceOptions(): DataSourceOptions {
    const fileConfig = getFileConfig(CONFIG_FILE);
    const envConfig = getEnvConfig();
    const config = {
        ...fileConfig,
        ...envConfig,
        namingStrategy: new LogionNamingStrategy(),
    };
    if(!config.type) {
        config.type = "postgres";
    }
    if(!config.entities) {
        config.entities = [];
    }
    config.entities.push(SessionAggregateRoot);
    return config;
}

export function getFileConfig(path: string): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    if(existsSync(path)) {
        const content = readFileSync(path);
        const config = JSON.parse(content.toString("utf-8"));
        validateConfig(config);
        return config;
    } else {
        return {};
    }
}

function validateConfig(config: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    ensureBoolean(config, "synchronize");
    ensureBoolean(config, "logging");
}

function ensureBoolean(config: any, field: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if(field in config && typeof config[field] !== "boolean") {
        throw new Error(`Unexpected type for ${field}`);
    }
}

export function getEnvConfig(): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    const options: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    setFromEnvIfDefined(options, "TYPEORM_CONNECTION", "type");
    setFromEnvIfDefined(options, "TYPEORM_HOST", "host");
    setFromEnvIfDefined(options, "TYPEORM_PORT", "port");
    setFromEnvIfDefined(options, "TYPEORM_USERNAME", "username");
    setFromEnvIfDefined(options, "TYPEORM_PASSWORD", "password");
    setFromEnvIfDefined(options, "TYPEORM_DATABASE", "database");
    setFromEnvIfDefined(options, "TYPEORM_SYNCHRONIZE", "synchronize", transformToBoolean);
    setFromEnvIfDefined(options, "TYPEORM_ENTITIES", "entities", transformToArrayOfString);
    setFromEnvIfDefined(options, "TYPEORM_MIGRATIONS", "migrations", transformToArrayOfString);
    setFromEnvIfDefined(options, "TYPEORM_LOGGING", "logging", transformToBoolean);
    validateConfig(options);
    return options;
}

function setFromEnvIfDefined(options: any, envName: string, optionName: string, transform?: (value: string) => any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const envValue = process.env[envName];
    if(envValue) {
        options[optionName] = transform !== undefined ? transform(envValue) : envValue;
    }
}

function transformToBoolean(value: string): boolean {
    return value === "true";
}

function transformToArrayOfString(value: string): string[] {
    return [ value ];
}

export function overrideDataSource(dataSource: DataSource) {
    deleteDataSourceByName("default");
    appDataSource = dataSource;
    addTransactionalDataSource(dataSource);
}

export const DefaultTransactional = (options?: WrapInTransactionOptions): MethodDecorator => {
    return Transactional({
        isolationLevel: IsolationLevel.SERIALIZABLE,
        ...options,
    });
};
