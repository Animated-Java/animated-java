import { defineConfig } from '@snavesutit/jestbench'

export default defineConfig({
	blockbenchVersion: 'latest',
	environment: 'animated-java-tests',
	// Built by `yarn prod` (the `test` script runs it first). The file name must
	// stay in sync with `BBPlugin.register(PACKAGE.name)` in src/plugin.ts.
	plugins: ['./dist/animated_java.js'],
})
