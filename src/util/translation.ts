// @ts-ignore
import en from '../lang/en.yaml'
import { formatStr, FormattingObject } from './misc'

const LANGUAGES: Record<string, Record<string, string>> = {
	en,
}

export const currentLanguage = settings.language.value

export function translate(key: string, formattingObject?: FormattingObject): string {
	// console.log(currentLanguage)
	const translated = LANGUAGES[currentLanguage][key]
	// Return the translation key if no valid translation is found.
	if (translated == undefined) return key
	// If a formatting object is provided, use it to format the translated string.
	if (formattingObject != undefined) return formatStr(translated, formattingObject)
	return translated
}
