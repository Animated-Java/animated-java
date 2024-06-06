import { Plugin } from 'esbuild'
import * as fs from 'fs/promises'
import * as pathjs from 'path'

const ASSET_OVERRIDES_PATH = './src/assets/vanillaAssetOverrides/'
const ASSET_OVERRIDES_INDEX = pathjs.join(ASSET_OVERRIDES_PATH, 'index.json')

type AssetOverrideIndex = Record<
	string,
	{
		override: string
	}
>

function plugin(): Plugin {
	return {
		name: 'assetOverridePlugin',
		setup(build) {
			build.onLoad({ filter: /index\.json$/ }, async () => {
				const index = JSON.parse(
					await fs.readFile(ASSET_OVERRIDES_INDEX, 'utf-8')
				) as AssetOverrideIndex
				const contents: any = {}
				for (const [path, override] of Object.entries(index)) {
					if (path.endsWith('.json')) {
						contents[path] = await fs.readFile(
							pathjs.join(ASSET_OVERRIDES_PATH, override.override),
							'utf-8'
						)
					} else if (path.endsWith('.png')) {
						contents[path] = (
							await fs.readFile(pathjs.join(ASSET_OVERRIDES_PATH, override.override))
						).toString('base64')
					} else {
						throw new Error(`Unsupported asset type: '${path}'`)
					}
				}

				return {
					contents: `export default ${JSON.stringify(contents)}`,
				}
			})
		},
	}
}

export default plugin
