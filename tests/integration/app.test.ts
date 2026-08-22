import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";
import request from "supertest";

describe("application", () => {
	it("should create an express application", () => {
		const app = createApp();

		expect(app).toBeDefined();
	});
});

describe('CORS', () => {
	const app = createApp();

	it('allows configured origins', async () => {
		const response = await request(app)
			.get('/health')
			.set('Origin', 'http://localhost:3000');

		expect(response.headers['access-control-allow-origin']).toBe(
			'http://localhost:3000',
		);
	});
});
