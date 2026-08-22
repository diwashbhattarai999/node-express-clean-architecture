import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@/app/create-app';

describe('Request ID', () => {
	const app = createApp();

	it('generates a request ID when one is not provided', async () => {
		const response = await request(app).get('/health');

		expect(response.status).toBe(200);
		expect(response.headers['x-request-id']).toEqual(expect.any(String));
	});

	it('preserves a valid incoming request ID', async () => {
		const requestId = 'test-request-123';

		const response = await request(app)
			.get('/health')
			.set('X-Request-ID', requestId);

		expect(response.status).toBe(200);
		expect(response.headers['x-request-id']).toBe(requestId);
	});

	it('replaces an oversized request ID', async () => {
		const requestId = 'a'.repeat(129);

		const response = await request(app)
			.get('/health')
			.set('X-Request-ID', requestId);

		expect(response.status).toBe(200);
		expect(response.headers['x-request-id']).not.toBe(requestId);
		expect(response.headers['x-request-id']).toEqual(expect.any(String));
	});
});
