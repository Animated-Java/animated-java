export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/')
}

export function isJsonPath(path: string): boolean {
	return path.endsWith('.json')
}

export function isFunctionTagPath(path: string): boolean {
	return path.endsWith('.json') && path.includes(`tags${PathModule.sep}functions`)
}
