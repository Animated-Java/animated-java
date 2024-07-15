/* eslint-env node */
import * as esbuild from 'esbuild'
import findCacheDir from 'find-cache-dir'
import * as fs from 'fs'
import * as path from 'path'

export { inlineWorkerPlugin as default }

function inlineWorkerPlugin(extraConfig) {
	return {
		name: 'esbuild-plugin-inline-worker',

		setup(build) {
			build.onLoad({ filter: /\.worker\.(js|jsx|ts|tsx)$/ }, async ({ path: workerPath }) => {
				// let workerCode = await fs.promises.readFile(workerPath, {
				//   encoding: 'utf-8',
				// });

				let workerCode = await buildWorker(workerPath, extraConfig)
				return {
					contents: `import inlineWorker from '__inline-worker'
export default function Worker() {
  return inlineWorker(${JSON.stringify(workerCode)});
}
`,
					loader: 'js',
				}
			})

			const name = extraConfig.workerName ? { name: extraConfig.workerName } : {}

			const inlineWorkerFunctionCode = `
export default function inlineWorker(scriptText) {
  let blob = new Blob([scriptText], {type: 'text/javascript'});
  let url = URL.createObjectURL(blob);
  let worker = new Worker(url, ${JSON.stringify(name)});
  URL.revokeObjectURL(url);
  return worker;
}
`

			build.onResolve({ filter: /^__inline-worker$/ }, ({ path }) => {
				return { path, namespace: 'inline-worker' }
			})
			build.onLoad({ filter: /.*/, namespace: 'inline-worker' }, () => {
				return { contents: inlineWorkerFunctionCode, loader: 'js' }
			})
		},
	}
}

let cacheDir = findCacheDir({
	name: 'esbuild-plugin-inline-worker',
	create: true,
})

async function buildWorker(workerPath, extraConfig) {
	let scriptNameParts = path.basename(workerPath).split('.')
	scriptNameParts.pop()
	scriptNameParts.push('js')
	let scriptName = scriptNameParts.join('.')
	let bundlePath = path.resolve(cacheDir, scriptName)

	if (extraConfig) {
		delete extraConfig.entryPoints
		delete extraConfig.outfile
		delete extraConfig.outdir
		delete extraConfig.workerName
	}

	await esbuild.build({
		entryPoints: [workerPath],
		bundle: true,
		minify: true,
		outfile: bundlePath,
		target: 'es2017',
		format: 'esm',
		...extraConfig,
	})

	return fs.promises.readFile(bundlePath, { encoding: 'utf-8' })
}
