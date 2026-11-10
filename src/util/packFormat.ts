/**
 * The last pack formats that use `pack_format` and `supported_formats`. Packs for newer formats
 * (1.21.9+) declare `min_format` and `max_format` instead, and fail to load if they still declare
 * `supported_formats` (Minecraft's `PackFormat.IntermediaryFormat`).
 */
export const LAST_LEGACY_PACK_FORMAT = { resource_pack: 64, data_pack: 81 } as const

export interface PackSection {
	pack_format?: number
	supported_formats?: unknown
	min_format?: unknown
	max_format?: unknown
}

/**
 * Declares that a pack supports exactly `format`, replacing whichever version fields an earlier
 * export, or the pack's author, left behind. Leaves every other field as is.
 */
export function setPackFormat(pack: PackSection, format: number, lastLegacyFormat: number) {
	if (format > lastLegacyFormat) {
		delete pack.pack_format
		delete pack.supported_formats
		pack.min_format = format
		pack.max_format = format
	} else {
		delete pack.min_format
		delete pack.max_format
		pack.pack_format = format
		pack.supported_formats = { min_inclusive: format, max_inclusive: format }
	}
}
