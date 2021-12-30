import rollup from 'rollup'
import options from '../../config/prod.animated-java.rollup.config'
import fs from 'fs'
import crypto from 'crypto'
import fixup from '../fixup'
;(async () => {
	const bundle = await rollup.rollup(options)
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
	const { output } = await bundle.generate(options.output)
	const header = fs.readFileSync('./HEADER.txt', 'utf-8')
	const licence = fs.readFileSync('./LICENSE', 'utf-8')
	for (const chunk of output) {
		if (chunk.fileName.endsWith('.js')) {
			const id = crypto
				.createHash('sha256')
				.update(chunk.code)
				.digest('hex')
			fs.writeFileSync(
				'./dist/animated_java.js',
				[
					'\n\n\n',
					makeBanner(
						licence.split('\n').map((_) => _.replace(/[\n\r]/g, ''))
					),
					'\n\n\n',
					'(()=>{',
					makeBanner(header.split('\n').map((_) => _.trim())),
					'\n\n\n',
					`console.log("hello from Animated Java!");
const konsole=new Proxy(console,{apply(a,b,c){(globalThis?.ANIMATED_JAVA?.logging??true)&&a(...c)},get(a,b){return typeof a[b]==="function"?function(...args){(globalThis?.ANIMATED_JAVA?.logging??true)&&a[b](...args)}:a[b]}});`,
					'\n\n\n',
					fixup(chunk.code, { BUILD_ID: id }),
					'})();',
				].join('\n')
			)
			console.log('BUILD-ID:', id)
		} else {
			console.log(`not emitting ${chunk.fileName}`)
		}
	}
})()
