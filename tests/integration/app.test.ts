import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";

describe("application", () => {
	it("should create an express application", () => {
		const app = createApp();

		expect(app).toBeDefined();
	});
});
