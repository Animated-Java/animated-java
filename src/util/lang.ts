// @ts-ignore
import { default as LANGUAGES, filenames as filepaths } from '../lang/*.yml'

interface TranslationFile {
	[key: string]: string | TranslationFile
}

function flattenTranslationStructure(
	translations: TranslationFile,
	path: string[] = []
): Record<string, string> {
	const result: Record<string, string> = {}
	for (const key in translations) {
		const value = translations[key]
		if (typeof value === 'string') {
			result[[...path, key].join('.')] = value
		} else {
			Object.assign(result, flattenTranslationStructure(value, [...path, key]))
		}
	}
	return result
}

const FILE_NAMES: string[] = filepaths.map((path: string) => PathModule.basename(path, '.yml'))
const TRANSLATIONS: Record<string, Record<string, string>> = Object.fromEntries(
	LANGUAGES.map((v: { default: TranslationFile }, i: number) => [
		FILE_NAMES[i],
		flattenTranslationStructure(v.default),
	])
)

export function translate(key: string, ...args: string[]): string {
	const langName = settings.language.value
	let lang = TRANSLATIONS[langName]
	if (!lang) {
		console.warn(`Unknown language '${langName}'`)
		lang = TRANSLATIONS.en
	}

	const localizedText = lang[key]
	if (!localizedText) {
		console.warn(`Could not find translation for '${key}' in language '${langName}'`)
		return key
	}

	return localizedText.replace(/\{(\d+)\}/g, (str, index) => {
		const replacement = args.at(Number(index))
		if (replacement === undefined) {
			console.warn(`Missing replacement for argument {${index}} in translation '${key}'`)
		}
		return replacement ?? ''
	})
}

export function translateMarkdown(key: string, ...args: string[]): string {
	return pureMarked(translate(key, ...args))
}

Language.data['format_category.animated-java'] = translate('format_category.animated-java')
