import { TextComponent } from 'book-and-quill'
import { makeTagSafe } from './tags'

namespace ENTITY_NAMES {
	export const ROOT = (exportNamespace: string) =>
		new TextComponent([
			'',
			{ text: makeTagSafe(exportNamespace), color: '#00aced' },
			'.',
			{ text: 'root', color: 'light_purple' },
		]).toString(true)

	export const NODE = (exportNamespace: string, type: string, name: string) =>
		new TextComponent([
			'',
			{ text: makeTagSafe(exportNamespace), color: '#00aced' },
			'.',
			{ text: type, color: 'light_purple' },
			'.',
			{ text: name, color: 'gold' },
		]).toString(true)
}

export default ENTITY_NAMES
