/**
 * A stable ID for a blueprint. Rigs keep it in a score, so the global tick can dispatch them to
 * their project without reading their data.
 */
export function getProjectId(blueprintId: string): number {
	// 32-bit FNV-1a, shifted down to fit a non-negative score.
	let hash = 0x811c9dc5
	for (const char of blueprintId) {
		hash ^= char.codePointAt(0)!
		hash = Math.imul(hash, 0x01000193)
	}
	return hash >>> 1
}
