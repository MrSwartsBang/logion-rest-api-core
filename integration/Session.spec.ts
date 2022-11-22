import { DateTime } from "luxon";
import { connect, executeScript, disconnect, checkNumOfRows } from "../src/TestDb";
import { DefaultTransactional, SessionAggregateRoot, SessionRepository } from "../src";
import { runOnTransactionCommit, runOnTransactionRollback } from "typeorm-transactional";

const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const existingSessionId = '0d9c1ca7-a2c5-48f7-b0fb-e66a977bc7b5';
const anotherExistingSessionId = 'fc4bfdc6-9e79-4959-9dd5-fde5b38f1f88';
const unknownSessionId = '5c03194a-1c07-4c7d-b9eb-3df722c15ae9';

describe('SessionRepository (read)', () => {

    beforeAll(async () => {
        await connect([ SessionAggregateRoot ]);
        await executeScript("integration/sessions.sql");
        repository = new SessionRepository();
    });

    let repository: SessionRepository;

    afterAll(async () => {
        await disconnect();
    });

    it("finds existing session", async () => {
        const session = await repository.find(userAddress, existingSessionId);
        expect(session).toBeDefined();
    })

    it("does not find unknown sessionId", async () => {
        const session = await repository.find(userAddress, unknownSessionId);
        expect(session).toBe(null);
    })

    it("does not find unknown userAddress", async () => {
        const session = await repository.find('unknown', existingSessionId);
        expect(session).toBe(null);
    })
})

describe('SessionRepository (write)', () => {

    beforeEach(async () => {
        await connect([ SessionAggregateRoot ]);
        await executeScript("integration/sessions.sql");
        repository = new SessionRepository();
        transactionHandler = new TransactionHandler(repository);
    });

    let repository: SessionRepository;

    let transactionHandler: TransactionHandler;

    afterEach(async () => {
        await disconnect();
    });

    it("saves session", async () => {
        const session = new SessionAggregateRoot();
        session.userAddress = "5FhGVcrmPpHutfbsR3d472Usrtk18Nk9sgVec5y3ApHf4jaK";
        session.sessionId = "17b1fa11-155e-4c78-a2bc-6d0b478b90bb"
        session.createdOn = DateTime.now().toJSDate()

        await transactionHandler.saveSession(session);
        // Then
        await checkNumOfRows(`SELECT *
                              FROM session
                              WHERE session_id = '${ session.sessionId }'`, 1);
        expect(transactionHandler.successfulCommit).toBe(true);
    })

    it("deletes session", async () => {
        // Given
        const session = new SessionAggregateRoot();
        session.userAddress = "5Ff2hkmpSZvgbj7aasT8Webo8hWUHdDGR74JqLUGQwFyhG6r";
        session.sessionId = anotherExistingSessionId
        session.createdOn = DateTime.now().toJSDate()
        // When
        await transactionHandler.deleteSession(session);
        // Then
        await checkNumOfRows(`SELECT *
                              FROM session
                              WHERE session_id = '${ session.sessionId }'`, 0);
        expect(transactionHandler.successfulCommit).toBe(true);
    })

    it("rollback on exception in handler", async () => {
        const session = new SessionAggregateRoot();
        session.userAddress = "5Ff2hkmpSZvgbj7aasT8Webo8hWUHdDGR74JqLUGQwFyhG6r";
        session.sessionId = anotherExistingSessionId
        session.createdOn = DateTime.now().toJSDate()

        await expectAsync(transactionHandler.failureOnDelete(session)).toBeRejectedWithError("expected failure");

        await checkNumOfRows(`SELECT *
                              FROM session
                              WHERE session_id = '${ session.sessionId }'`, 1);
        expect(transactionHandler.rollback).toBe(true);
    })
});

class TransactionHandler {

    constructor(repository: SessionRepository) {
        this.repository = repository;
    }

    private repository: SessionRepository;

    get successfulCommit(): boolean {
        return this._successfulCommit || false;
    }

    private _successfulCommit: boolean | undefined;

    get rollback(): boolean {
        return this._rollback || false;
    }

    private _rollback: boolean | undefined;

    @DefaultTransactional()
    async saveSession(session: SessionAggregateRoot) {
        runOnTransactionCommit(() => this._successfulCommit = true);
        await this.repository.save(session);
    }

    @DefaultTransactional()
    async deleteSession(session: SessionAggregateRoot) {
        runOnTransactionCommit(() => this._successfulCommit = true);
        await this.repository.delete(session);
    }

    @DefaultTransactional()
    async failureOnDelete(session: SessionAggregateRoot) {
        runOnTransactionRollback(() => this._rollback = true);
        this.throwError();
        await this.repository.delete(session);
    }

    private throwError() {
        throw new Error("expected failure");
    }
}
