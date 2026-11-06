import { checkPaletteSet } from './checks'
import { getTargetVersion, translate } from './host'
import { getBasePixels, getStripColors } from './preview'
import { getBaseLabel, type PaletteSet } from './sets'

/**
 * Runs the set checks on `sets` and returns a message for every error, like
 * `Permutation Set "armor": The suffix "Gold!" can only use ...`. Warnings don't stop an export.
 */
export async function findPaletteExportErrors(sets: PaletteSet[]): Promise<string[]> {
	const version = getTargetVersion()
	const errors: string[] = []
	for (const set of sets) {
		const data = set.palette_set
		const [key, permutations, bases] = await Promise.all([
			getStripColors(data, data.key),
			Promise.all(
				data.permutations.map(async p => ({
					suffix: p.suffix,
					colors: await getStripColors(data, p.strip),
				}))
			),
			Promise.all(
				data.bases.map(async base => ({
					name: getBaseLabel(data, base),
					pixels: (await getBasePixels(data, base))?.data,
				}))
			),
		])
		for (const issue of checkPaletteSet({
			version,
			separator: data.separator,
			key,
			permutations,
			bases,
		})) {
			if (issue.severity !== 'error') continue
			errors.push(
				translate('export_error', set.name, translate('issue.' + issue.code, ...issue.args))
			)
		}
	}
	return errors
}
