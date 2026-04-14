import PACKAGEJSON from '../package.json'
export const PACKAGE: typeof PACKAGEJSON = PACKAGEJSON

const FS_MODULE = requireNativeModule('fs', {
	message: 'Save and load Minecraft client data',
	optional: false,
})!

export const fs = FS_MODULE
