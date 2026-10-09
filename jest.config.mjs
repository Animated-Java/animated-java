import preset from '@snavesutit/jestbench/jest-preset.js'

// jestbench's preset supplies the Blockbench test environment, global
// setup/teardown, custom matchers, `maxWorkers: 1` and an extended timeout.
// We only add the TypeScript transform and point it at our suite.

/** @type {import('jest').Config} */
export default {
	...preset,
	rootDir: '.',
	testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
	// The fast pure-logic lane runs under `jest.unit.config.mjs` (plain Node, no
	// Blockbench). Keep it out of the jestbench run.
	testPathIgnorePatterns: ['<rootDir>/src/tests/unit/'],
	// Tests open blueprints, which fetch the target Minecraft version's assets
	// (downloaded and cached on first run).
	testTimeout: 120_000,
	transform: {
		'^.+\\.tsx?$': [
			'@swc/jest',
			{
				jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
				module: { type: 'commonjs' },
			},
		],
	},
}
