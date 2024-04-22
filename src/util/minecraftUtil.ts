import * as pathjs from 'path'

export function toSafeFuntionName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_\\.]/g, '_')
		.replace(/_+/g, '_')
}

export function isResourcePackPath(path: string) {
	const parsed = parseResourcePackPath(path)
	return !!(parsed && parsed.namespace && parsed.resourcePath)
}

export function parseResourcePackPath(path: string) {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return undefined

	const resourcePackRoot = parts.slice(0, assetsIndex).join('/')
	const namespace = parts[assetsIndex + 1]
	// const type = parts[assetsIndex + 2]
	const resourcePath = parts.slice(assetsIndex + 3, -1).join('/')
	const fileName = pathjs.basename(path).split('.').slice(0, -1).join('.')
	if (fileName !== fileName.toLowerCase()) return undefined
	const resourceLocation = (namespace + ':' + PathModule.join(resourcePath, fileName)).replaceAll(
		/\\/g,
		'/'
	)

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation,
		fileName,
		fileExtension: pathjs.extname(path),
	}
}

export function isDataPackPath(path: string) {
	const parsed = parseDataPackPath(path)
	return !!(parsed && parsed.namespace && parsed.resourcePath)
}

export function parseDataPackPath(path: string) {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('data')
	if (assetsIndex === -1) return undefined

	const resourcePackRoot = parts.slice(0, assetsIndex).join('/')
	const namespace = parts[assetsIndex + 1]
	const type = parts[assetsIndex + 2]
	let resourcePath: string
	switch (type) {
		case 'tags':
			resourcePath = parts.slice(assetsIndex + 4, -1).join('/')
			break
		default:
			resourcePath = parts.slice(assetsIndex + 3, -1).join('/')
			break
	}
	const fileName = pathjs.basename(path).split('.').slice(0, -1).join('.')
	if (fileName !== fileName.toLowerCase()) return undefined
	const resourceLocation = (namespace + ':' + PathModule.join(resourcePath, fileName)).replaceAll(
		/\\/g,
		'/'
	)
	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation,
		fileName,
		fileExtension: pathjs.extname(path),
	}
}

export interface IFunctionTag {
	replace?: boolean
	values: Array<string | { id: string; required?: boolean }>
}

export function mergeTag(oldTag: IFunctionTag, newTag: IFunctionTag): IFunctionTag {
	oldTag.values.forEach(value => {
		if (typeof value === 'string') {
			if (!newTag.values.some(v => (typeof v === 'object' ? v.id === value : v === value))) {
				newTag.values.push(value)
			}
		} else {
			if (
				!newTag.values.some(v =>
					typeof v === 'object' ? v.id === value.id : v === value.id
				)
			) {
				newTag.values.push(value)
			}
		}
	})
	return newTag
}
