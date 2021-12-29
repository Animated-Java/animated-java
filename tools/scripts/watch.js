import rollup from 'rollup'
import options from '../../config/dev.animated-java.rollup.config'
import fs from 'fs'
import chalk from 'chalk'
import fixup from '../fixup'
const watcher = rollup.watch(options)
let shouldTransform = false
watcher.on('event', (event) => {
	console.log('AAAAAAA', event.code)
	switch (event.code) {
		case 'START':
			console.log(chalk.green('building...'))
			shouldTransform = true
			break
		case 'END':
			if (shouldTransform) {
				shouldTransform = false
				console.log(chalk.green('transforming...'))
				fs.writeFileSync(
					'./dist/animated_java.js',
					`(()=>{\n${fixup(
						fs.readFileSync('./dist/animated_java.js', 'utf-8'),
						{
							BUILD_ID:
								'dbb29fae73ce8a216b2d4f4e0da42a36fd348983cae2e96587463def059fee9a',
						}
					)}\n})();\n`
				)
				console.log(chalk.green('done!'))
			}
			break
		case 'BUNDLE_START':
			console.log(chalk.gray(`bundling ${event.input}...`))
			break
		case 'BUNDLE_END':
			console.log(chalk.gray(`done ${event.input}...`))
			break
		case 'ERROR':
			// console.log(chalk.gray(event.error.stack));
			console.log(chalk.red(event.error.message))
			break
	}
})
// watcher.on('restart', console.log)
// watcher.on('change', console.log)
// watcher.on('close', console.log)
