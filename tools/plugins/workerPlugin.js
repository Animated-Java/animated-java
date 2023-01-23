import * as esbuild from 'esbuild'
import { extname, relative, resolve } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import crypto from 'crypto'
const hash = str => crypto.createHash('md5').update(str).digest('hex')
let TypeDefs = new Map()
function indentString(str, indent) {
	str = str.replace(/^\s+/gm, '')
	let indentCount = 0
	let lines = str.split('\n')
	let result = ''
	for (let line of lines) {
		let myIndent = indentCount
		for (let i = 0; i < line.length; i++) {
			if (line[i] === '{') {
				indentCount++
			} else if (line[i] === '}') {
				indentCount--
				myIndent = indentCount
			}
		}
		result += (myIndent > 0 ? indent.repeat(myIndent) : '') + line.trim() + '\n'
	}
	return result.trim()
}
export const workerPlugin = ({ builder, typeDefPath }) => ({
	name: 'worker',
	setup(build) {
		build.onResolve({ filter: /^worker!/ }, args => {
			const moduleName = args.path
			const filePath = resolve(args.resolveDir, args.path.slice(7))
			const typePath = `${filePath
				.replace(/\\/g, '/')
				.replace(/\.(ts|tsx|js|jsx)$/, '')}.types.ts`

			if (!existsSync(typePath)) {
				TypeDefs.set(
					args.path,
					`declare module '${moduleName}' {
// no file found at ${relative(process.cwd(), typePath)}
	class CustomWorker extends Worker {
		constructor()
	}
	export = CustomWorker
}`
				)
			} else {
				TypeDefs.set(
					args.path,
					`declare module '${moduleName}' {
	${readFileSync(typePath, 'utf8').replace(/export /g, '')}
	class TypedWorker extends Worker {
		constructor()
		subscribe(callback: (arg:Result)=>void): ()=>void
		postMessage(message: Data): void
	}
	export = TypedWorker
}`
				)
			}
			return {
				path: filePath,
				namespace: 'worker',
				watchFiles: existsSync(typePath) ? [typePath] : [],
			}
		})
		const cacheDir = resolve(process.cwd(), '.cache', 'worker')
		mkdirSync(cacheDir, { recursive: true })
		build.onLoad({ filter: /.*/, namespace: 'worker' }, async args => {
			const cachePath = resolve(cacheDir, hash(args.path) + '.ts')
			writeFileSync(
				cachePath,
				`import workerMethod from ${JSON.stringify(
					args.path
				)}\nonmessage=function(e:MessageEvent){workerMethod(e.data).then((result: any)=>{postMessage(result)})}`
			)
			const result = await builder(cachePath)
			let watchFiles = [args.path]
			if (result.metafile) {
				watchFiles = Object.keys(result.metafile.inputs)
			}
			const codeContent = result.outputFiles.find(file => file.path === `<stdout>`)?.text
			if (!codeContent) throw new Error('No code found')
			return {
				watchFiles,
				contents: `
					export default class CustomWorker extends Worker{
						static code = ${JSON.stringify(codeContent)}
						subscribers = new Set<Function>();
						constructor(){
							const url = URL.createObjectURL(new Blob([CustomWorker.code]))
							super(url)
							URL.revokeObjectURL(url)
							this.onmessage = (e: MessageEvent) => {
								this.subscribers.forEach(callback => callback(e.data))
							}
						}
						subscribe(callback: Function){
							this.subscribers.add(callback)
							return () => this.subscribers.delete(callback)
						}
						postMessage(message: any){
							super.postMessage(message)
						}
					}
				`,
				loader: 'ts',
			}
		})
		if (typeDefPath)
			build.onEnd(() => {
				writeFileSync(
					typeDefPath,
					`//GENERATED FILE\n` +
						indentString(Array.from(TypeDefs.values()).join('\n'), '\t')
				)
			})
	},
})
