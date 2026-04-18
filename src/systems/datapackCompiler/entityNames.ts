import { TextComponent } from 'book-and-quill'

namespace ENTITY_NAMES {
	export const ROOT = (exportNamespace: string) =>
		new TextComponent([
			'',
			{ text: 'aj', color: '#00aced' },
			'.',
			{ text: exportNamespace, color: 'yellow' },
			'.',
			{ text: 'root', color: 'light_purple' },
		]).toString(true)

	export const NODE = (exportNamespace: string, type: string, name: string) =>
		new TextComponent([
			'',
			{ text: 'aj', color: '#00aced' },
			'.',
			{ text: exportNamespace, color: 'yellow' },
			'.',
			{ text: type, color: 'light_purple' },
			'.',
			{ text: name, color: 'gold' },
		]).toString(true)
}

export default ENTITY_NAMES
