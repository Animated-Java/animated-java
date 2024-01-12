// @ts-ignore
import en from '../lang/en.yaml'
// @ts-ignore
import de from '../lang/de.yaml'
// @ts-ignore
import zh from '../lang/zh_cn.yaml'
import { formatStr, FormattingObject } from './misc'

const LANGUAGES: Record<string, Record<string, string>> = {
	en,
	de,
	zh,
}

export const currentLanguage = settings.language.value

export function translate(key: string, formatObj?: FormattingObject): string {
	let language = LANGUAGES[currentLanguage]
	if (!LANGUAGES[currentLanguage]) language = LANGUAGES.en

	const translated = language[key]
	// Return the translation key if no valid translation is found.
	if (translated == undefined) return key
	// If a formatting object is provided, use it to format the translated string.
	if (formatObj != undefined) return formatStr(translated, formatObj)
	return translated
}

export function addTranslations(language: string, translations: Record<string, string>) {
	for (const key in translations) {
		if (LANGUAGES[language][key] !== undefined) {
			console.warn(`Translation key '${key}' is already defined. Discarding new translation.`)
			continue
		}
		LANGUAGES[language][key] = translations[key]
	}
}
