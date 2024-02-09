import { defineConfig } from "tsup";

export default defineConfig((options) => {
	return {
		...options,
		treeshake: true,
		legacyOutput: true,
		entry: ["src/**/*.{ts,tsx}", "src/**/*.css", "!src/**/*.test.ts"],
		splitting: false,
		sourcemap: true,
		clean: true,
		dts: false,
		minify: !options.watch,
		format: ["cjs"],
		bundle: false,
	};
});
