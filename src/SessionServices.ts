import { Repository } from "typeorm";
import { injectable } from "inversify";

import { appDataSource } from "./DataSourceProvider.js";
import { DateTime } from "luxon";
import { requireDefined } from "./Assertions.js";
import { SessionAggregateRoot } from "./SessionEntity.js";

@injectable()
export class SessionRepository {

    constructor() {
        this.repository = appDataSource.getRepository(SessionAggregateRoot);
    }

    readonly repository: Repository<SessionAggregateRoot>;

    async save(session: SessionAggregateRoot): Promise<void> {
        await this.repository.save(session);
    }

    async find(userAddress: string, sessionId: string): Promise<SessionAggregateRoot | null> {
        const builder = this.repository.createQueryBuilder("session");
        builder
            .where("session.user_address = :userAddress", { userAddress: userAddress })
            .andWhere("session.session_id = :sessionId", { sessionId: sessionId })
        return await builder.getOne();
    }

    async delete(session: SessionAggregateRoot): Promise<void> {
        await this.repository.delete(requireDefined(session.userAddress));
    }
}

export interface NewSessionParameters {
    userAddress: string,
    sessionId: string,
    createdOn: DateTime,
}

@injectable()
export class SessionFactory {

    newSession(params: NewSessionParameters): SessionAggregateRoot {
        const root = new SessionAggregateRoot();
        root.userAddress = params.userAddress;
        root.sessionId = params.sessionId;
        root.createdOn = params.createdOn.toJSDate();
        return root;
    }
}
