import * as pathjs from 'path'

export function toSafeFuntionName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_\\.]/g, '_')
		.replace(/_+/g, '_')
}

export function isResourcePackPath(path: string) {
	const parsed = parseResourcePackPath(path)
	return parsed && parsed.namespace && parsed.resourcePath
}

export function parseResourcePackPath(path: string) {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return undefined

	const resourcePackRoot = parts.slice(0, assetsIndex).join('/')
	const namespace = parts[assetsIndex + 1]
	const resourcePath = parts.slice(assetsIndex + 3).join('/')
	const fileName = pathjs.basename(path).split('.')[0]
	if (fileName !== fileName.toLowerCase()) return undefined
	const resourceLocation = namespace + ':' + resourcePath

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation,
		fileName,
		fileExtension: pathjs.extname(path),
	}
}
