export function safeFunctionName(name: string) {
	return name
		.replace(/[\s-]/g, '_')
		.replace(/[^a-zA-Z0-9_\\.]/g, '')
		.toLowerCase()
}

export function isValidResourcePackMcMeta(path: string) {
	const parsed = PathModule.parse(path)
	const assetsPath = PathModule.join(parsed.dir, 'assets')
	return parsed.base === 'pack.mcmeta' && fs.existsSync(path) && fs.existsSync(assetsPath)
}

export function isValidDataPackMcMeta(path: string) {
	const parsed = PathModule.parse(path)
	const dataPath = PathModule.join(parsed.dir, 'data')
	return parsed.base === 'pack.mcmeta' && fs.existsSync(path) && fs.existsSync(dataPath)
}

export function isValidResourcePackPath(path: string) {
	const parsed = parseResourcePackPath(path)
	return parsed && parsed.namespace && parsed.resourcePath
}

export function parseResourcePackPath(path: string) {
	path = path.replace(/[\\/]/g, PathModule.sep)
	const parts = path.split(PathModule.sep)

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return false

	const resourcePackRoot = parts.slice(0, assetsIndex).join(PathModule.sep)

	const namespace = parts[assetsIndex + 1]
	if (namespace !== namespace.toLowerCase()) return false

	const resourcePath = parts.slice(assetsIndex + 3).join(PathModule.sep)
	if (resourcePath !== resourcePath.toLowerCase()) return false

	const fileName = parts[parts.length - 1]
	if (fileName !== fileName.toLowerCase()) return false

	let resourceLocation = namespace + ':' + resourcePath.replace(/\\/g, '/')
	const index = resourceLocation.lastIndexOf('.')
	if (index !== -1) resourceLocation = resourceLocation.substring(0, index)

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation,
		fileName,
	}
}

export function isValidDatapackName(name: string, type: string) {
	const safeName = safeFunctionName(name)
	if (name !== safeName)
		throw new Error(`Invalid ${type} name "${name}". Try "${safeName}" instead.`)
}
