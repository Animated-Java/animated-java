import * as pathjs from 'path'

export function safeFunctionName(name: string) {
	return name
		.replace(/[\s-]/g, '_')
		.replace(/[^a-zA-Z0-9_]/g, '')
		.toLowerCase()
}

export function isValidResourcePackPath(path: string) {
	const parsed = parseResourcePackPath(path)
	return parsed.namespace && parsed.resourcePath
}

export function parseResourcePackPath(path: string) {
	// const parsed = pathjs.parse(path)
	const parts = path.split(pathjs.sep)

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return {}

	const resourcePackRoot = parts.slice(0, assetsIndex).join(pathjs.sep)

	const namespace = parts[assetsIndex + 1]
	if (namespace !== namespace.toLowerCase()) return {}

	const resourcePath = parts.slice(assetsIndex + 2).join(pathjs.sep)
	if (resourcePath !== resourcePath.toLowerCase()) return {}

	const fileName = parts[parts.length - 1]
	if (fileName !== fileName.toLowerCase()) return {}

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation: `${namespace}:${resourcePath.replace(/\\/g, '/')}`,
		fileName,
	}
}
