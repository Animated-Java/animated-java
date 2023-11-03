// @ts-ignore
import { default as LANGUAGES, filenames } from '../lang/*.yml'

console.log(LANGUAGES, filenames)

export function translate(key: string, ...args: string[]) {
	const lang = LANGUAGES[settings.language.value] as Record<string, string>
	if (!lang) {
		console.warn(`Could not find language '${settings.language.value as string}'`)
		return key
	}
	const translation = lang[key]
	if (translation) {
		return translation.replace(/\{(\d+)\}/g, (str, index) => args[index] || '')
	} else {
		return key
	}
}
