/// <reference path="./lang.d.ts"/>

import ESBuild from 'esbuild'
import { existsSync } from 'fs'
import { readdir, readFile } from 'fs/promises'
import { load } from 'js-yaml'
import { join } from 'path'

const filterYamlFiles = (file: string) => {
	return file.endsWith('.yml') || file.endsWith('.yaml')
}

const flattenStructuredLanguageFile = (file: StructuredLanguageFile): Record<string, string> => {
	const result: Record<string, string> = {}
	for (const key in file) {
		if (typeof file[key] === 'string') {
			result[key] = file[key]
			continue
		}

		for (const [subKey, value] of Object.entries(flattenStructuredLanguageFile(file[key]))) {
			result[`${key}.${subKey}`] = value
		}
	}
	return result
}

const langPlugin = ({ languageFolder }: LangPluginOptions) =>
	({
		name: 'lang',
		setup(build) {
			if (!existsSync(languageFolder)) {
				throw new Error(`Language folder "${languageFolder}" does not exist.`)
			}

			build.onResolve({ filter: /LANGUAGES/ }, () => {
				return {
					path: languageFolder,
					namespace: 'language-file',
				}
			})

			build.onLoad({ filter: /.*/, namespace: 'language-file' }, async () => {
				const translations: Record<string, LanguageDefinition> = {}

				const files = (await readdir(languageFolder)).filter(filterYamlFiles)
				if (files.length === 0) {
					console.warn(`No language files found in "${languageFolder}"`)
				}

				const watchFiles: string[] = []

				for (const file of files) {
					const path = join(languageFolder, file)
					watchFiles.push(path)

					const name = file.replace(/\.(yml|yaml)$/, '')
					const structured: StructuredLanguageFile = await readFile(path, {
						encoding: 'utf-8',
					}).then(data => load(data, { filename: path }) as StructuredLanguageFile)
					const flattened = flattenStructuredLanguageFile(structured)

					translations[name] = { name, structured, flattened }
				}

				const contents =
					`export const LANGUAGES = ${JSON.stringify(translations)};` +
					`export const flattenStructuredLanguageFile = ${flattenStructuredLanguageFile.toString()};`

				return {
					contents,
					loader: 'js',
					watchFiles,
				}
			})
		},
	}) satisfies ESBuild.Plugin

export default langPlugin
