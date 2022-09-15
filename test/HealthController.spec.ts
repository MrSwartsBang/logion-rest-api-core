import request from 'supertest';
import { Container } from "inversify";
import { Mock } from "moq.ts";

import { setupApp, mockAuthenticationWithCondition } from "../src/TestApp";
import { HealthController, HealthService } from "../src/HealthController";

describe('HealthController', () => {

    beforeEach(() => {
        process.env.HEALTH_TOKEN = EXPECTED_TOKEN;
    })

    it('OK when authenticated and up', async () => {
        const app = setupApp(HealthController, container => bindMocks(container, true));

        await request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${EXPECTED_TOKEN}`)
            .expect(200);
    });

    it('Unauthorized', async () => {
        const mock = mockAuthenticationWithCondition(false);
        const app = setupApp(HealthController, container => bindMocks(container, true), mock);

        await request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${UNEXPECTED_TOKEN}`)
            .expect(401);
    })

    it('Internal when authenticated and down', async () => {
        const app = setupApp(HealthController, container => bindMocks(container, false));

        await request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${EXPECTED_TOKEN}`)
            .expect(500);
    })
});

const EXPECTED_TOKEN = "the-health-check-token";

const UNEXPECTED_TOKEN = "wrong-health-check-token";

function bindMocks(container: Container, up: boolean): void {
    const healthService = new Mock<HealthService>();
    if(up) {
        healthService.setup(instance => instance.checkHealth()).returns(Promise.resolve());
    } else {
        healthService.setup(instance => instance.checkHealth).returns(() => Promise.reject(new Error()));
    }
    container.bind(HealthService).toConstantValue(healthService.object());
}
