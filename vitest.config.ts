import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",

		include: ["tests/**/*.test.ts"],

		exclude: ["node_modules/**", "dist/**", "coverage/**"],

		globals: false,

		clearMocks: true,
		restoreMocks: true,
		mockReset: true,

		coverage: {
			provider: "v8",

			include: ["src/**/*.ts"],

			exclude: ["src/**/*.d.ts", "src/**/index.ts", "src/server.ts"],

			reporter: ["text", "json", "html"],

			reportsDirectory: "./coverage",
		},
	},
});
