import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

import { SessionFactory, SessionAggregateRoot, NewSessionParameters } from "../src/index.js";
import { ALICE } from "../src/TestApp.js";

describe("SessionFactory", () => {

    it("createSession", () => {
        const sessionId = givenSessionId()
        const params = { sessionId, userAddress: ALICE, createdOn: DateTime.now() }
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
    expect(session.userAddress).toBe(params.userAddress);
    expect(session.createdOn).toEqual(params.createdOn.toJSDate());
}
