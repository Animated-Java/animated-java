export function toSafeFuntionName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_\\.]/g, '_')
		.replace(/_+/g, '_')
}
