// @ts-expect-error No types
import { default as LANGUAGES, filenames as filepaths } from '../lang/*.yml'

const FILE_NAMES = filepaths.map((path: string) => PathModule.basename(path, '.yml'))

export function translate(key: string, ...args: string[]) {
	let languageIndex = FILE_NAMES.indexOf(settings.language.value)
	if (languageIndex === -1) {
		console.warn(`Could not find language '${settings.language.value as string}'`)
		languageIndex = FILE_NAMES.indexOf('en')
	}
	const lang = LANGUAGES[languageIndex] as Record<string, string>
	if (!key.startsWith('animated_java.')) {
		key = `animated_java.${key}`
	}
	const translation = lang[key]
	if (translation) {
		return translation.replace(/\{(\d+)\}/g, (str, index) => args[index] || '')
	} else {
		const enIndex = FILE_NAMES.indexOf('en')
		if (languageIndex !== enIndex) {
			const langEn = LANGUAGES[enIndex] as Record<string, string>
			const translationEn = langEn[key]
			if (translationEn) {
				console.warn(
					`Missing translation for '${key}' in '${
						settings.language.value as string
					}', falling back to English`
				)
				return langEn[key].replace(/\{(\d+)\}/g, (str, index) => args[index] || '')
			}
		}
		console.warn(`Could not find translation for '${key}'`)
		return key
	}
}
