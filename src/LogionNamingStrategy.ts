import { DefaultNamingStrategy, Table } from "typeorm";

const MAX_NAME_LENGTH = 63;

export class LogionNamingStrategy extends DefaultNamingStrategy {

    primaryKeyName(tableOrName: Table | string): string {
        const tableName = this.actualTableName(tableOrName);
        return `PK_${ tableName }`
    }

    private actualTableName(tableOrName: Table | string): string {
        return typeof tableOrName === "string" ? tableOrName : tableOrName.name;
    }

    uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
        const tableName = this.actualTableName(tableOrName);
        return columnNames.reduce((name, column) => `${ name }_${ column }`, `UQ_${ tableName }`)
            .substring(0, MAX_NAME_LENGTH);
    }

    foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
        const tableName = this.actualTableName(tableOrName);
        return columnNames.reduce((name, column) => `${ name }_${ column }`, `FK_${ tableName }`)
            .substring(0, MAX_NAME_LENGTH);
    }

    indexName(tableOrName: Table | string, columnNames: string[]): string {
        const tableName = this.actualTableName(tableOrName);
        return columnNames.reduce((name, column) => `${ name }_${ column }`, `IX_${ tableName }`)
            .substring(0, MAX_NAME_LENGTH);
    }
}
