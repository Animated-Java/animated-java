import PACKAGEJSON from '../package.json'
import { localize } from './util/lang'
export const PACKAGE: typeof PACKAGEJSON = PACKAGEJSON

let cachedFsModule: ScopedFS | null = null
export function getFsModule() {
	cachedFsModule ??= requireNativeModule('fs', {
		message: localize('require.fs'),
		optional: false,
	})!
	return cachedFsModule
}

// Super lazy-loading of properties, so that we don't load the fs or fs.promises module until it's actually used by a dependency.
export default new Proxy(
	{},
	{
		get(target, prop) {
			if (prop === 'promises') {
				return new Proxy(
					{},
					{
						get(target, prop) {
							return (...args: any[]) => {
								// @ts-expect-error
								return getFsModule().promises[prop as keyof ScopedFS['promises']](
									...args
								)
							}
						},
					}
				)
			}

			return (...args: any[]) => {
				// @ts-expect-error
				return getFsModule()[prop as keyof ScopedFS](...args)
			}
		},
	}
)
