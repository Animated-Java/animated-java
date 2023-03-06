export function safeFunctionName(name: string) {
	return name
		.replace(/[\s-]/g, '_')
		.replace(/[^a-zA-Z0-9_]/g, '')
		.toLowerCase()
}

export function isValidResourcePackPath(path: string) {
	const parsed = parseResourcePackPath(path)
	return parsed && parsed.namespace && parsed.resourcePath
}

export function parseResourcePackPath(path: string) {
	const parts = path.split(PathModule.sep)

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return false

	const resourcePackRoot = parts.slice(0, assetsIndex).join(PathModule.sep)

	const namespace = parts[assetsIndex + 1]
	if (namespace !== namespace.toLowerCase()) return false

	const resourcePath = parts.slice(assetsIndex + 2).join(PathModule.sep)
	if (resourcePath !== resourcePath.toLowerCase()) return false

	const fileName = parts[parts.length - 1]
	if (fileName !== fileName.toLowerCase()) return false

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation: `${namespace}:${resourcePath.replace(/\\/g, '/')}`,
		fileName,
	}
}

export function isValidDatapackName(name: string, type: string) {
	const safeName = safeFunctionName(name)
	if (name !== safeName)
		throw new Error(`Invalid ${type} name "${name}". Try "${safeName}" instead.`)
}
