import { DEFAULT_SEPARATOR, supportsSeparator } from './atlas'
import { findDuplicateKeyColors, type PaletteColors } from './recolor'

export type PaletteIssueSeverity = 'error' | 'warning'

export interface IPaletteIssue {
	severity: PaletteIssueSeverity
	/** Lang key under `palettes.issue.`, filled with {@link args}. */
	code: string
	args: string[]
}

export interface IPaletteCheckInput {
	version: string
	separator: string
	/** Undefined when the key is referenced but couldn't be read. */
	key: PaletteColors | undefined
	permutations: Array<{ suffix: string; colors: PaletteColors | undefined }>
	/** `pixels` is undefined when the base couldn't be read. */
	bases: Array<{ name: string; pixels: Uint8ClampedArray | undefined }>
}

/** Suffixes and separators end up in sprite ids, so they're limited to resource path characters. */
const SUFFIX_PATTERN = /^[a-z0-9_.-]+$/
const SEPARATOR_PATTERN = /^[a-z0-9_.\-/]*$/

/** Turns a file name or resource id into a valid suffix, like `Gold Trim.png` -> `gold_trim`. */
export function toSuffix(name: string): string {
	const suffix = name
		.replace(/\.png$/i, '')
		.replace(/^.*[:/]/, '')
		.toLowerCase()
		.replace(/[^a-z0-9_.-]/g, '_')
	return suffix || 'palette'
}

/** `suffix`, numbered like `gold_2` if it's already in `taken`. */
export function uniqueSuffix(suffix: string, taken: Iterable<string>): string {
	const used = new Set(taken)
	let candidate = suffix
	for (let i = 2; used.has(candidate); i++) candidate = `${suffix}_${i}`
	return candidate
}

const issue = (severity: PaletteIssueSeverity, code: string, ...args: string[]): IPaletteIssue => ({
	severity,
	code,
	args,
})

/**
 * Checks a Permutation Set for anything Minecraft would reject or render unexpectedly. Errors stop
 * an export; warnings and info are shown in the set editor.
 */
export function checkPaletteSet(input: IPaletteCheckInput): IPaletteIssue[] {
	const issues: IPaletteIssue[] = []

	if (!SEPARATOR_PATTERN.test(input.separator)) {
		issues.push(issue('error', 'invalid_separator', input.separator))
	} else if (input.separator !== DEFAULT_SEPARATOR && !supportsSeparator(input.version)) {
		issues.push(issue('error', 'separator_unsupported', input.version))
	}

	if (!input.bases.length) issues.push(issue('warning', 'no_bases'))
	if (!input.permutations.length) issues.push(issue('warning', 'no_permutations'))

	const { key } = input
	if (key === undefined) {
		issues.push(issue('warning', 'key_unreadable'))
	} else if (!key.length) {
		issues.push(issue('error', 'no_key'))
	} else {
		for (const color of findDuplicateKeyColors(key)) {
			issues.push(issue('warning', 'duplicate_key_color', color))
		}
	}

	const suffixes = new Set<string>()
	for (const { suffix, colors } of input.permutations) {
		if (!SUFFIX_PATTERN.test(suffix)) issues.push(issue('error', 'invalid_suffix', suffix))
		else if (suffixes.has(suffix)) issues.push(issue('error', 'duplicate_suffix', suffix))
		suffixes.add(suffix)

		if (colors === undefined) {
			issues.push(issue('warning', 'palette_unreadable', suffix))
		} else if (key && colors.length !== key.length) {
			issues.push(
				issue('error', 'palette_length', suffix, String(colors.length), String(key.length))
			)
		}
	}

	for (const base of input.bases) {
		if (!base.pixels) issues.push(issue('warning', 'base_unreadable', base.name))
	}

	return issues
}
