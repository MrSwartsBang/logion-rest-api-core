import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

import { SessionFactory, SessionAggregateRoot, NewSessionParameters } from "../src/index.js";
import { ALICE, validAccountId } from "../src/TestApp.js";

describe("SessionFactory", () => {

    it("createSession", () => {
        const sessionId = givenSessionId()
        const params: NewSessionParameters = {
            sessionId,
            account: validAccountId(ALICE),
            createdOn: DateTime.now()
        }
        whenCreatingSession(params);
        thenSessionCreatedWith(params)
    })
})

function whenCreatingSession(params: NewSessionParameters) {
    session = factory.newSession(params)
}

function givenSessionId(): string {
    return uuid();
}

const factory = new SessionFactory();
let session: SessionAggregateRoot;

function thenSessionCreatedWith(params: NewSessionParameters) {
    expect(session.sessionId).toBe(params.sessionId);
    expect(session.userAddress).toBe(params.account.address);
    expect(session.userAddressType).toBe(params.account.type);
    expect(session.createdOn).toEqual(params.createdOn.toJSDate());
}
