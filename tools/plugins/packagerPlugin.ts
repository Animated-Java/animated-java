import { Plugin } from 'esbuild'
import * as fs from 'fs'
import * as pathjs from 'path'

const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const PLUGIN_PACKAGE_PATH = './src/pluginPackage/'
const DIST_PATH = './dist/pluginPackage/'

function plugin(): Plugin {
	return {
		name: 'packagerPlugin',
		setup(build) {
			build.onEnd(() => {
				fs.rmSync(DIST_PATH, { recursive: true, force: true })
				fs.cpSync(PLUGIN_PACKAGE_PATH, DIST_PATH, { recursive: true })
				fs.copyFileSync(
					`./dist/${PACKAGE.name}.js`,
					pathjs.join(DIST_PATH, PACKAGE.name + '.js')
				)
			})
		},
	}
}

export default plugin
