import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@/app/create-app';

describe('Security headers', () => {
	const app = createApp();

	it('sets X-Content-Type-Options', async () => {
		const response = await request(app).get('/health');

		expect(response.headers['x-content-type-options']).toBe('nosniff');
	});

	it('sets X-Frame-Options', async () => {
		const response = await request(app).get('/health');

		expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
	});

	it('sets the configured Referrer-Policy', async () => {
		const response = await request(app).get('/health');

		expect(response.headers['referrer-policy']).toBe(
			'strict-origin-when-cross-origin',
		);
	});
});
