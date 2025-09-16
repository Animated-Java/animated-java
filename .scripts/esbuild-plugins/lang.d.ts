interface LangPluginOptions {
	languageFolder: string
}

interface StructuredLanguageFile {
	[key: string]: string | StructuredLanguageFile
}

interface LanguageDefinition {
	name: string
	structured: StructuredLanguageFile
	flattened: Record<string, string>
}

declare module 'LANGUAGES' {
	export const LANGUAGES: Record<string, LanguageDefinition>
	export function flattenStructuredLanguageFile(
		file: StructuredLanguageFile
	): Record<string, string>
}
