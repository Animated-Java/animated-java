import PACKAGEJSON from '../package.json'
import { localize as translate } from './util/lang'
export const PACKAGE: typeof PACKAGEJSON = PACKAGEJSON

let cachedFsModule: ScopedFS | null = null
export function getFsModule() {
	cachedFsModule ??= requireNativeModule('fs', {
		message: translate('require.fs'),
		optional: false,
	})!
	return cachedFsModule
}
