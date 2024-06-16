import { Plugin } from 'esbuild'
import * as fs from 'fs/promises'
import * as pathjs from 'path'

const ASSET_OVERRIDES_PATH = 'src/assets/vanillaAssetOverrides/'

function plugin(): Plugin {
	return {
		name: 'assetOverridePlugin',
		setup(build) {
			build.onLoad({ filter: /index\.json$/ }, async () => {
				const contents: any = {}

				const recurse = async (dir: string) => {
					for (const path of await fs.readdir(dir)) {
						if ((await fs.stat(pathjs.join(dir, path))).isDirectory()) {
							await recurse(pathjs.join(dir, path))
						}

						if (path.endsWith('.json') || path.endsWith('.png')) {
							const key = pathjs
								.join('assets', dir, path)
								// @ts-expect-error
								.replaceAll(pathjs.sep, '/')
								.replace(ASSET_OVERRIDES_PATH, '')
							if (path.endsWith('.json')) {
								contents[key] = await fs.readFile(pathjs.join(dir, path), 'utf-8')
							} else if (path.endsWith('.png')) {
								contents[key] = (
									await fs.readFile(pathjs.join(dir, path))
								).toString('base64')
							} else {
								throw new Error(`Unsupported asset type: '${path}'`)
							}
						}
					}
				}

				await recurse(ASSET_OVERRIDES_PATH)

				return {
					contents: `export default ${JSON.stringify(contents)}`,
				}
			})
		},
	}
}

export default plugin
