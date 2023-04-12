import { Repository } from "typeorm";
import { injectable } from "inversify";

import { appDataSource } from "./DataSourceProvider.js";
import { DateTime } from "luxon";
import { requireDefined } from "./Assertions.js";
import { SessionAggregateRoot } from "./SessionEntity.js";
import { ValidAccountId, AccountId } from "@logion/node-api";

@injectable()
export class SessionRepository {

    constructor() {
        this.repository = appDataSource.getRepository(SessionAggregateRoot);
    }

    readonly repository: Repository<SessionAggregateRoot>;

    async save(session: SessionAggregateRoot): Promise<void> {
        await this.repository.save(session);
    }

    async find(accountId: AccountId, sessionId: string): Promise<SessionAggregateRoot | null> {
        const builder = this.repository.createQueryBuilder("session");
        builder
            .where("session.user_address = :userAddress", { userAddress: accountId.address })
            .andWhere("session.user_address_type = :userAddressType", { userAddressType: accountId.type })
            .andWhere("session.session_id = :sessionId", { sessionId: sessionId })
        return await builder.getOne();
    }

    async delete(session: SessionAggregateRoot): Promise<void> {
        await this.repository.delete({
            userAddress: requireDefined(session.userAddress),
            userAddressType: requireDefined(session.userAddressType)
        });
    }
}

export interface NewSessionParameters {
    account: ValidAccountId,
    sessionId: string,
    createdOn: DateTime,
}

@injectable()
export class SessionFactory {

    newSession(params: NewSessionParameters): SessionAggregateRoot {
        const root = new SessionAggregateRoot();
        root.userAddress = params.account.address;
        root.userAddressType = params.account.type;
        root.sessionId = params.sessionId;
        root.createdOn = params.createdOn.toJSDate();
        return root;
    }
}
