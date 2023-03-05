// @ts-ignore
import en from '../lang/en.yaml'

type TranslationFormattingObject = Record<string, string>

const LANGUAGES: Record<string, Record<string, string>> = {
	en,
}

export function formatStr(str: string, formatObj: TranslationFormattingObject = {}) {
	// Sort the keys by size. This makes sure %a and %abc aren't confused.
	const keys = Object.keys(formatObj).sort((a, b) => b.length - a.length)
	for (const target of keys) str = str.replace(new RegExp('%' + target, 'g'), formatObj[target])
	return str
}

export const currentLanguage = settings.language.value

export function translate(key: string, formattingObject?: TranslationFormattingObject): string {
	// console.log(currentLanguage)
	const translated = LANGUAGES[currentLanguage][key]
	// Return the translation key if no valid translation is found.
	if (translated == undefined) return key
	// If a formatting object is provided, use it to format the translated string.
	if (formattingObject != undefined) return formatStr(translated, formattingObject)
	return translated
}
