export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/')
}

export function isJsonPath(path: string): boolean {
	return path.endsWith('.json')
}

export function isFunctionTagPath(path: string): boolean {
	return (
		path.endsWith('.json') &&
		(path.includes(`tags\\function`) || path.includes(`tags/function`))
	)
}

export function resolveEnvVariables(path: string) {
	return path.replace(/%([^%]+)%/g, function (_, key: string) {
		if (!process.env[key]) {
			throw new Error('Environment variable ' + key + ' does not exist.')
		}
		return process.env[key]!
	})
}

export function isRelativePath(path: string) {
	return path.startsWith('./') || path.startsWith('../')
}

export function resolveRelativePath(path: string) {
	if (!Project?.save_path) return
	const saveFolder = PathModule.dirname(Project.save_path)
	return PathModule.resolve(saveFolder, path)
}

export function resolvePath(path: string): string {
	if (isRelativePath(path)) {
		const newPath = resolveRelativePath(path)
		if (!newPath) {
			throw new Error(`Failed to resolve relative path '${path}'`)
		}
		path = newPath
	}

	return normalizePath(resolveEnvVariables(path))
}
