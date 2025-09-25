export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/')
}

export function isJsonPath(path: string): boolean {
	return path.endsWith('.json')
}

export function isFunctionTagPath(path: string): boolean {
	return (
		path.endsWith('.json') &&
		(path.includes(`tags\\function`) ||
			path.includes(`tags/function`) ||
			path.includes(`tags\\functions`) ||
			path.includes(`tags/functions`))
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
	return (
		path.startsWith('./') ||
		path.startsWith('../') ||
		path.startsWith('.\\') ||
		path.startsWith('..\\')
	)
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

export function swapPathRoot(path: string, oldRoot: string, newRoot: string) {
	path = normalizePath(path)
	oldRoot = normalizePath(oldRoot)
	newRoot = normalizePath(newRoot)
	if (path.startsWith(oldRoot)) {
		return PathModule.join(newRoot, path.slice(oldRoot.length))
	}
	throw new Error(`Cannot swap path root! Path "${path}" does not start with "${oldRoot}"`)
}

export function safeReadSync(path: string): Buffer | undefined {
	try {
		return fs.readFileSync(path)
	} catch (e) {
		return undefined
	}
}

export async function safeRead(path: string) {
	return fs.promises.readFile(path).catch(() => undefined)
}
