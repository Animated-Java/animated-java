import {
	type LegacyClickEvent,
	type LegacyHoverEvent,
	type ModernClickEvent,
	type ModernHoverEvent,
	type TextElement,
	type TextObject,
} from '.'
import { compareVersions } from './parser'

enum FEATURES {
	REQUIRE_DOUBLE_QUOTES = 1 << 0,
	RESOLVE_SPACE_ESCAPE_SEQUENCES = 1 << 1,
}

export class JsonTextStringifier {
	enabledFeatures = FEATURES.REQUIRE_DOUBLE_QUOTES | FEATURES.RESOLVE_SPACE_ESCAPE_SEQUENCES

	constructor(private minecraftVersion: string) {
		if (compareVersions(this.minecraftVersion, '1.21.5') >= 0) {
			this.enabledFeatures &= ~FEATURES.REQUIRE_DOUBLE_QUOTES
			this.enabledFeatures &= ~FEATURES.RESOLVE_SPACE_ESCAPE_SEQUENCES
		}
	}

	stringify(element: TextElement): string {
		return this.stringifyTextElement(element)
	}

	/**
	 * Escapes and stringifies a string for SNBT representation.
	 *
	 * Reduces escaping by choosing the optimal quote type.
	 *
	 * Prefers single quotes.
	 */
	private stringifyString(str: string): string {
		str = str.replaceAll('\n', '\\n')
		if (this.enabledFeatures & FEATURES.RESOLVE_SPACE_ESCAPE_SEQUENCES) {
			str = str.replaceAll('\\s', ' ')
		}

		// Remove escaped quotes for accurate detection
		const unescaped = str.replace(/\\'/g, "'").replace(/\\"/g, '"')
		const hasSingle = unescaped.includes("'")
		const hasDouble = unescaped.includes('"')

		if (this.enabledFeatures & FEATURES.REQUIRE_DOUBLE_QUOTES) {
			return `"${unescaped.replace(/"/g, '\\"')}"`
		} else if (hasSingle && hasDouble) {
			// Both quotes present, fallback to single quotes and escape single quotes
			return `'${unescaped.replace(/'/g, "\\'")}'`
		} else if (hasSingle) {
			// Only single quotes present, use double quotes
			return `"${unescaped.replace(/"/g, '\\"')}"`
		} else {
			// Use single quotes
			return `'${unescaped.replace(/'/g, "\\'")}'`
		}
	}

	private stringifyTextElementArray(arr: TextElement[]): string {
		return `[${arr.map(e => this.stringifyTextElement(e)).join(',')}]`
	}

	private stringifyScoreObject(score: NonNullable<TextObject['score']>): string {
		if (this.enabledFeatures & FEATURES.REQUIRE_DOUBLE_QUOTES) {
			return (
				`{"name":${this.stringifyString(score.name)}` +
				`,"objective":${this.stringifyString(score.objective)}}`
			)
		}
		return (
			`{name:${this.stringifyString(score.name)}` +
			`,objective:${this.stringifyString(score.objective)}}`
		)
	}

	private stringifyPlayerObject(player: NonNullable<TextObject['player']>): string {
		const q = this.enabledFeatures & FEATURES.REQUIRE_DOUBLE_QUOTES ? '"' : ''
		const result: string[] = []
		if (player.name !== undefined) {
			result.push(`${q}name${q}:${this.stringifyString(player.name)}`)
		}
		if (player.id !== undefined) {
			result.push(`${q}id${q}:${JSON.stringify(player.id)}`)
		}
		if (player.texture !== undefined) {
			result.push(`${q}texture${q}:${player.texture}`)
		}
		if (player.cape !== undefined) {
			result.push(`${q}cape${q}:${player.cape}`)
		}
		if (player.model !== undefined) {
			result.push(`${q}model${q}:${this.stringifyString(player.model)}`)
		}
		if (player.hat !== undefined) {
			result.push(`${q}hat${q}:${player.hat}`)
		}
		if (player.properties !== undefined) {
			for (const prop of player.properties) {
				result.push(
					`{name:${this.stringifyString(prop.name)}` +
						`,value:${this.stringifyString(prop.value)}` +
						(prop.signature === undefined
							? ''
							: `,signature:${this.stringifyString(prop.signature)}`) +
						'}'
				)
			}
		}
		return '{' + result.join(',') + '}'
	}

	private stringifyLegacyHoverEvent(event: LegacyHoverEvent): string {
		switch (event.action) {
			case 'show_text': {
				return `{"action":"show_text","contents":${this.stringifyTextElement(
					event.contents
				)}}`
			}

			case 'show_item': {
				let result = `{"action":"show_item","contents":`

				if (typeof event.contents === 'string') {
					result += this.stringifyString(event.contents)
				} else {
					result += '{"id":' + this.stringifyString(event.contents.id)

					if (event.contents.count !== undefined) {
						result += `,"count":${event.contents.count}`
					}

					if (event.contents.tag !== undefined) {
						result += `,"tag":${this.stringifyTextElement(event.contents.tag)}`
					}
				}

				return result + `}}`
			}

			case 'show_entity': {
				let result = `{"action":"show_entity","contents":{"type":${this.stringifyString(
					event.contents.type
				)}`

				if (Array.isArray(event.contents.id)) {
					result += `,"id":[${event.contents.id.join(',')}]`
				} else if (typeof event.contents.id === 'string') {
					result += `,"id":${this.stringifyString(event.contents.id)}`
				}

				if (event.contents.name !== undefined) {
					result += `,"name":${this.stringifyTextElement(event.contents.name)}`
				}

				return result + `}}`
			}
		}
	}

	private stringifyModernHoverEvent(event: ModernHoverEvent): string {
		switch (event.action) {
			case 'show_text': {
				return `{action:show_text,value:${this.stringifyTextElement(event.value)}}`
			}

			case 'show_item': {
				let result = `{action:show_item,id:${this.stringifyString(event.id)}`

				if (event.count !== undefined) {
					result += `,count:${event.count}`
				}

				// `components` is not supported by the parser

				return result + `}`
			}

			case 'show_entity': {
				let result = `{action:show_entity,id:${this.stringifyString(event.id)}`

				if (event.name !== undefined) {
					result += `,name:${this.stringifyTextElement(event.name)}`
				}

				if (Array.isArray(event.uuid)) {
					result += `,uuid:[I;${event.uuid.join(',')}]`
				} else if (typeof event.uuid === 'string') {
					result += `,uuid:${this.stringifyString(event.uuid)}`
				}

				return result + `}`
			}
		}
	}

	private stringifyLegacyClickEvent(event: LegacyClickEvent): string {
		return `{"action":"${event.action}","value":${this.stringifyString(event.value)}}`
	}

	private stringifyModernClickEvent(event: ModernClickEvent): string {
		switch (event.action) {
			case 'open_url':
				return `{action:open_url,url:${this.stringifyString(event.url)}}`

			case 'open_file':
				return `{action:open_file,path:${this.stringifyString(event.path)}}`

			case 'run_command':
				return `{action:run_command,command:${this.stringifyString(event.command)}}`

			case 'suggest_command':
				return `{action:suggest_command,command:${this.stringifyString(event.command)}}`

			case 'copy_to_clipboard':
				return `{action:copy_to_clipboard,value:${this.stringifyString(event.value)}}`

			case 'change_page':
				return `{action:change_page,page:${event.page}}`

			case 'show_dialog':
				throw new Error('show_dialog click events are not supported in text displays')

			case 'custom':
				let result = `{action:custom,id:${this.stringifyString(event.id)}`

				if (event.payload !== undefined) {
					result += `,payload:${this.stringifyTextElement(event.payload)}`
				}

				return result + `}`
		}
	}

	private stringifyTextObject(obj: TextObject): string {
		const entries: string[] = []

		for (const key of Object.keys(obj) as Array<keyof TextObject>) {
			if (obj[key] === undefined) continue

			// Quote character to use for keys
			const q = this.enabledFeatures & FEATURES.REQUIRE_DOUBLE_QUOTES ? '"' : ''
			const quotedKey = q + key + q

			switch (key) {
				case 'type':
				case 'text':
				case 'translate':
				case 'fallback':
				case 'keybind':
				case 'nbt':
				case 'source':
				case 'block':
				case 'entity':
				case 'storage':
				case 'selector':
				case 'font':
				case 'insertion':
				case 'object':
				case 'sprite':
				case 'atlas':
				case 'color':
					// Value is a string
					entries.push(`${quotedKey}:${this.stringifyString(obj[key])}`)
					break

				case 'shadow_color':
					if (Array.isArray(obj[key])) {
						entries.push(`${quotedKey}:${JSON.stringify(obj[key])}`)
						break
					}
				// color and shadow_color fall through to number | bool case
				case 'bold':
				case 'italic':
				case 'obfuscated':
				case 'strikethrough':
				case 'underlined':
				case 'interpret':
					// Value is a number or boolean
					entries.push(`${quotedKey}:${obj[key]}`)
					break

				case 'with':
				case 'extra':
				case 'separator':
					// Value is an array of components
					entries.push(`${quotedKey}:${this.stringifyTextElement(obj[key]!)}`)
					break

				case 'score':
					entries.push(`${quotedKey}:${this.stringifyScoreObject(obj[key])}`)
					break

				case 'player':
					entries.push(`${quotedKey}:${this.stringifyPlayerObject(obj[key])}`)
					break

				case 'clickEvent':
					entries.push(`${quotedKey}:${this.stringifyLegacyClickEvent(obj[key])}`)
					break

				case 'click_event':
					entries.push(`${quotedKey}:${this.stringifyModernClickEvent(obj[key])}`)
					break

				case 'hoverEvent':
					entries.push(`${quotedKey}:${this.stringifyLegacyHoverEvent(obj[key])}`)
					break

				case 'hover_event':
					entries.push(`${quotedKey}:${this.stringifyModernHoverEvent(obj[key])}`)
					break

				default:
					console.warn(`Unknown key in TextObject: '${key}'`)
					break
			}
		}

		return `{${entries.join(',')}}`
	}

	private stringifyTextElement(element: TextElement): string {
		if (typeof element === 'string') {
			return this.stringifyString(element)
		} else if (Array.isArray(element)) {
			return this.stringifyTextElementArray(element)
		} else if (typeof element === 'object' && element !== null) {
			return this.stringifyTextObject(element)
		} else {
			console.error(element)
			throw new Error('Invalid TextElement')
		}
	}
}
