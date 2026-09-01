import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		dir: 'src/tests',
		server: {
			deps: {
				// `book-and-quill` and its `generic-stream` dep ship extensionless
				// ESM imports that Node's native resolver rejects; inlining lets
				// Vite/esbuild transform them the way the plugin build does.
				inline: ['book-and-quill', 'generic-stream'],
			},
		},
	},
})
