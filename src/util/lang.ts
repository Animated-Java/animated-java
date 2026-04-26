/// <reference path="../../.scripts/plugins/lang.d.ts"/>

import { LANGUAGES } from 'LANGUAGES'

function getCurrentLanguage() {
	const langName = settings.language.value as string
	let lang = LANGUAGES[langName]
	if (!lang) {
		console.warn(`Unknown language '${langName}'`)
		lang = LANGUAGES.en
	}
	return lang
}

function replaceLocalizationPlaceholders(template: string, ...args: string[]) {
	return template.replace(/%s/g, () => args.shift() ?? '')
}

/**
 * Translates a key using the current language, formatting it with any additional arguments.
 *
 * Localization placeholders in the form of `%s` are replaced with the provided arguments.
 *
 * If the localized text starts with `[Markdown]`, it will be parsed as Markdown.
 *
 * @returns The localized string, or the key itself if no translation is found.
 */
export function localize(key: string, ...args: string[]): string {
	const lang = getCurrentLanguage()

	let localizedText = lang.flattened[key]
	localizedText ??= lang.flattened['animated_java.' + key]
	localizedText ??= LANGUAGES.en.flattened[key]
	localizedText ??= LANGUAGES.en.flattened['animated_java.' + key]

	if (!localizedText) {
		console.warn(`Could not find translation for '${key}' in language '${lang.name}'`)
		return key
	}

	if (args.length > 0) {
		localizedText = replaceLocalizationPlaceholders(localizedText, ...args)
	}

	if (localizedText.startsWith('[Markdown]')) {
		return pureMarked(localizedText.replace('[Markdown]', '').trim())
	}

	return localizedText
}

/**
 * Creates a scoped translator function that prefixes all keys with {@link prefix}.
 * @example
 * const localize = createScopedTranslator('panel.arm_rotation')
 * localize('title') // Translates 'panel.arm_rotation.title'
 */
export function createScopedTranslator(prefix: string): typeof localize {
	if (!prefix || prefix.endsWith('.') || prefix.startsWith('.')) {
		throw new Error(`Invalid translation key prefix '${prefix}'`)
	}

	return (key, ...args) => localize(prefix + '.' + key, ...args)
}
