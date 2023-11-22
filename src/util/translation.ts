// @ts-ignore
import { default as LANGUAGES, filenames as filepaths } from '../lang/*.yml'

const FILE_NAMES = filepaths.map((path: string) => PathModule.basename(path, '.yml'))

export function translate(key: string, ...args: string[]) {
	const languageIndex = FILE_NAMES.indexOf(settings.language.value)
	if (languageIndex === -1) {
		console.warn(`Could not find language '${settings.language.value as string}'`)
		console.log(`Available languages: ${FILE_NAMES.join(', ') as string}`)
		return key
	}
	const lang = LANGUAGES[languageIndex] as Record<string, string>
	if (!key.startsWith('animated_java.')) {
		key = `animated_java.${key}`
	}
	const translation = lang[key]
	if (translation) {
		return translation.replace(/\{(\d+)\}/g, (str, index) => args[index] || '')
	} else {
		console.warn(`Could not find translation for '${key}'`)
		return key
	}
}
