const fs = require('fs')
function makeBanner(lines) {
	const longest = Math.max(...lines.map((line) => line.length))
	const top = `/*${'*'.repeat(longest)}*\\`
	const bottom = `\\*${'*'.repeat(longest)}*/`
	const res = [
		top,
		...lines.map((line) => {
			return `| ${line}${' '.repeat(longest - line.length)} |`
		}),
		bottom,
	]
	return res.join('\n')
}
const flavor = process.env.FLAVOR?.split('/').pop()
	? 'git-' + process.env.FLAVOR?.split('/').pop()
	: process.argv[2] || `local`
const start = Date.now()
const dev = process.argv.includes('dev')
const yaml = require('js-yaml')
const env = yaml.load(fs.readFileSync('./env.yaml', 'utf8'))
const esbuild = require('esbuild')
;(async () => {
	await esbuild.build({
		entryPoints: ['./lang-mc-worker/web_worker.js'],
		outfile: './src/dependencies/lang-mc-worker/lang-mc.worker.wjs',
		bundle: true,
		minify: true,
		format: 'cjs',
	})
	esbuild
		.build({
			entryPoints: ['./src/animatedJava.ts'],
			bundle: true,
			outfile: 'dist/animated_java.js',
			loader: {
				'.js': 'jsx',
				'.svg': 'dataurl',
				'.png': 'dataurl',
				'.wjs': 'dataurl',
				'.css': 'text',
			},
			platform: 'node',
			plugins: [
				require('esbuild-plugin-yaml').yamlPlugin(),
				{
					name: 'build-id',
					setup(build) {
						build.onEnd((result) => {
							const content = fs.readFileSync(
								'./dist/animated_java.js',
								'ascii'
							)
							const hash = require('crypto')
								.createHash('sha256')
								.update(content)
								.digest('hex')
							const id = flavor + '-' + hash
							console.log('TEST')
							fs.writeFileSync(
								'./dist/animated_java.js',
								content.replace(
									'process.env.BUILD_ID',
									JSON.stringify(id)
								),
								'ascii'
							)
						})
					},
				},
			],
			minify: !dev,
			format: 'iife',
			banner: {
				js: dev
					? '// animated java development build\n'
					: makeBanner(
							fs
								.readFileSync('./HEADER.txt', 'utf8')
								.split('\n')
								.map((_) => _.trim())
					  ) +
					  '\n'.repeat(10) +
					  makeBanner(
							fs
								.readFileSync('./LICENSE', 'utf8')
								.split('\n')
								.map((_) => _.trim())
					  ),
			},
			define: {
				'process.env.NODE_ENV': dev ? '"development"' : '"production"',
				...Object.fromEntries(
					Object.entries(env).map(([k, v]) => [
						'process.env.' + k,
						JSON.stringify(v),
					])
				),
				...(dev
					? {
							'process.env.BUILD_ID': "'development'",
					  }
					: {}),
			},
			// sourcemap: dev ? 'inline' : false,
			sourcemap: 'inline',
			sourceRoot: 'src/',
			sourcesContent: dev,
			watch: dev,
			incremental: dev,
			charset: 'ascii',
		})
		.then((res) => {
			console.log(JSON.stringify(res.metafile))
			const end = Date.now()
			console.log(end - start)
		})
		.catch(() => process.exit(1))
})()
