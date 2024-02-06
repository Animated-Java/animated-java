export function safeFunctionName(name: string) {
	return name
		.replace(/[\s-]+/g, '_')
		.replace(/[^a-zA-Z0-9_\\.]+/g, '')
		.toLowerCase()
}
