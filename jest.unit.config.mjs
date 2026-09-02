/**
 * Fast unit lane: plain-Node Jest for modules of pure logic that never touch
 * Blockbench's host globals. No plugin build, no headless Blockbench launch -
 * these run in milliseconds.
 *
 * End-to-end tests that need the real app stay in `jest.config.mjs`
 * (jestbench). That config ignores `src/tests/unit/`.
 *
 * @type {import('jest').Config}
 */
export default {
	rootDir: '.',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/src/tests/unit/**/*.test.ts'],
	setupFiles: ['<rootDir>/src/tests/unit/setup.ts'],
	// A few util modules import host-dependent siblings at load time (an fs
	// accessor, block/registry lookups) that only their non-pure functions ever
	// call. Swap those imports for a no-op so the pure functions can be reached.
	moduleNameMapper: {
		'(^|/)constants$': '<rootDir>/src/tests/unit/__stubs__/hostModule.cjs',
		'/systems/minecraft/blockModelManager$':
			'<rootDir>/src/tests/unit/__stubs__/hostModule.cjs',
		'/systems/minecraft/blockstateManager$':
			'<rootDir>/src/tests/unit/__stubs__/hostModule.cjs',
		'/systems/minecraft/registryManager$': '<rootDir>/src/tests/unit/__stubs__/hostModule.cjs',
	},
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
