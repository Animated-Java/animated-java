// @ts-ignore
import { default as LANGUAGES, filenames as filepaths } from '../lang/*.yml'

const FILE_NAMES = filepaths.map((path: string) => PathModule.basename(path, '.yml'))

interface TranslationFile {
	[key: string]: string | TranslationFile
}

function flattenTranslations(obj: TranslationFile, path: string[] = []): Record<string, string> {
	const result: Record<string, string> = {}
	for (const key in obj) {
		const value = obj[key]
		if (typeof value === 'string') {
			result[[...path, key].join('.')] = value
		} else {
			Object.assign(result, flattenTranslations(value, [...path, key]))
		}
	}
	return result
}

const TRANSLATIONS = LANGUAGES.map((v: { default: TranslationFile }) =>
	flattenTranslations(v.default)
)

export function translate(key: string, ...args: string[]) {
	let languageIndex = FILE_NAMES.indexOf(settings.language.value)
	if (languageIndex === -1) {
		console.warn(`Could not find language '${settings.language.value as string}'`)
		languageIndex = FILE_NAMES.indexOf('en')
	}
	const lang = TRANSLATIONS[languageIndex] as Record<string, string>

	let translation = lang[key]
	if (translation === undefined && !key.startsWith('animated_java.')) {
		translation = lang[`animated_java.${key}`]
	}
	if (translation) {
		return translation.replace(/\{(\d+)\}/g, (str, index) => args[index] || '')
	} else {
		console.warn(`Could not find translation for '${key}' or 'animated_java.${key}'`)
		return key
	}
}

Language.data['format_category.animated_java'] = translate('format_category.animated_java')
