import PACKAGEJSON from '../package.json'
import { translate } from './util/translation'
export const PACKAGE: typeof PACKAGEJSON = PACKAGEJSON

const FS_MODULE = requireNativeModule('fs', {
	message: translate('require.fs'),
	optional: false,
})!

export const fs = FS_MODULE
