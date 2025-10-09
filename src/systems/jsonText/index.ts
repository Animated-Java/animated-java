import { JsonTextParser } from './parser'
import { JsonTextStringifier } from './stringifier'

export const FONT = '16px MinecraftFull'

export enum STYLE_KEYS {
	BOLD = 'bold',
	ITALIC = 'italic',
	UNDERLINED = 'underlined',
	STRIKETHROUGH = 'strikethrough',
	OBFUSCATED = 'obfuscated',
	COLOR = 'color',
	FONT = 'font',
	SHADOW_COLOR = 'shadow_color',
}

export enum CONTENT_TYPES {
	TEXT = 'text',
	TRANSLATABLE = 'translatable',
	SCORE = 'score',
	SELECTOR = 'selector',
	KEYBIND = 'keybind',
	NBT = 'nbt',
	OBJECT = 'object',
}

export enum CONTENT_KEYS {
	TEXT = 'text',
	TRANSLATE = 'translate',
	SCORE = 'score',
	SELECTOR = 'selector',
	KEYBIND = 'keybind',
	NBT = 'nbt',
	SPRITE = 'sprite',
	PLAYER = 'player',
}

export enum EVENT_KEYS {
	CLICK_EVENT = 'click_event',
	HOVER_EVENT = 'hover_event',
	LEGACY_CLICK_EVENT = 'clickEvent',
	LEGACY_HOVER_EVENT = 'hoverEvent',
}

export enum NBT_SOURCE_KEYS {
	BLOCK = 'block',
	ENTITY = 'entity',
	STORAGE = 'storage',
}

export const COLOR_VALUES = {
	dark_red: '#AA0000',
	red: '#FF5555',
	gold: '#FFAA00',
	yellow: '#FFFF55',
	dark_green: '#00AA00',
	green: '#55FF55',
	aqua: '#55FFFF',
	dark_aqua: '#00AAAA',
	dark_blue: '#0000AA',
	blue: '#5555FF',
	light_purple: '#FF55FF',
	dark_purple: '#AA00AA',
	white: '#FFFFFF',
	gray: '#AAAAAA',
	dark_gray: '#555555',
	black: '#000000',
} as const

export type ComponentStyle = Pick<TextObject, STYLE_KEYS>
export type TextObjectColor = keyof typeof COLOR_VALUES | `#${string}`
export type TextObjectShadowColor = number | [number, number, number, number]

export interface LegacyClickEvent {
	action:
		| 'open_url'
		| 'open_file'
		| 'run_command'
		| 'suggest_command'
		| 'change_page'
		| 'copy_to_clipboard'
	value: string
}

export type LegacyHoverEvent =
	| { action: 'show_text'; contents: TextElement }
	| {
			action: 'show_item'
			contents:
				| string
				| {
						id: string
						count?: number
						// Text displays dont support hover events anyway,
						// so I'll just ignore this for now.
						tag?: any
				  }
	  }
	| {
			action: 'show_entity'
			contents: {
				type: string
				id: string | [number, number, number, number]
				name?: string
			}
	  }

export enum MODERN_CLICK_EVENT_SUBKEYS {
	ID = 'id',
	URL = 'url',
	PATH = 'path',
	COMMAND = 'command',
	PAGE = 'page',
	VALUE = 'value',
	DIALOG = 'dialog',
	PAYLOAD = 'payload',
}

export type ModernClickEvent =
	| {
			action: 'open_url'
			url: string
	  }
	| {
			action: 'open_file'
			path: string
	  }
	| {
			action: 'run_command'
			command: string
	  }
	| {
			action: 'suggest_command'
			command: string
	  }
	| {
			action: 'change_page'
			page: number
	  }
	| {
			action: 'copy_to_clipboard'
			value: string
	  }
	| {
			action: 'show_dialog'
			// Text displays don't support click events anyway, so I'll just ignore this type for now.
			dialog: string | any
	  }
	| {
			action: 'custom'
			id: string
			payload?: any
	  }

export type ModernHoverEvent =
	| {
			action: 'show_text'
			value: TextElement
	  }
	| {
			action: 'show_item'
			id: string
			count?: number
			components?: any
	  }
	| {
			action: 'show_entity'
			id: string
			uuid: string | [number, number, number, number]
			name?: string
	  }

export interface TextObject {
	type?: CONTENT_TYPES

	text?: string

	translate?: string
	fallback?: string
	with?: TextElement[]

	score?: {
		name: string
		objective: string
	}

	selector?: string
	separator?: TextElement

	keybind?: string

	nbt?: string
	source?: 'block' | 'entity' | 'storage'
	block?: string
	entity?: string
	storage?: string
	interpret?: boolean

	object?: 'atlas' | 'player'
	sprite?: string
	atlas?: string
	player?: {
		name?: string
		id?: string | [number, number, number, number]
		texture?: string
		cape?: string
		model?: 'wide' | 'slim'
		hat?: boolean
		properties?: Array<{
			name: string
			value: string
			signature?: string
		}>
	}

	font?: string
	color?: TextObjectColor
	bold?: boolean
	italic?: boolean
	underlined?: boolean
	strikethrough?: boolean
	obfuscated?: boolean
	shadow_color?: TextObjectShadowColor

	extra?: TextElement[]
	insertion?: string

	clickEvent?: LegacyClickEvent
	hoverEvent?: LegacyHoverEvent
	click_event?: ModernClickEvent
	hover_event?: ModernHoverEvent
}

export type TextElement = string | TextElement[] | TextObject

export class JsonText {
	static defaultStyle: ComponentStyle = { color: 'white' }
	static defaultMinecraftVersion = '1.21.9'

	isJsonTextClass = true
	content: TextElement

	constructor(jsonText: TextElement) {
		this.content = jsonText
	}

	toString(minify = true, minecraftVersion = JsonText.defaultMinecraftVersion) {
		const content = minify ? this.flatten() : this.content
		return new JsonTextStringifier(content, minecraftVersion).stringify()
	}

	toJSON(): TextElement {
		return structuredClone(this.content)
	}

	/**
	 * Returns a flattened version of this JsonText.
	 *
	 * If `explicitStyles` is true, all styles will be explicitly set on each component,
	 * even if they are the same as the parent style.
	 */
	flatten(explicitStyles = false): Array<string | TextObject> {
		const output: Array<string | TextObject> = []

		const processComponent = (element: TextElement, parentStyle: ComponentStyle = {}) => {
			const style = JsonText.getComponentStyle(element, parentStyle)
			const previous = output[output.length - 1]
			switch (true) {
				case Array.isArray(element): {
					for (const child of element) {
						processComponent(child, style)
					}
					break
				}

				case typeof element === 'string':
					// Merge with previous element if possible
					if (typeof previous === 'string' && JsonText.hasSameStyle(style, parentStyle)) {
						output[output.length - 1] = previous + element
						break
					} else if (
						typeof previous === 'object' &&
						previous.text !== undefined &&
						JsonText.hasSameStyle(style, previous)
					) {
						previous.text += element
						break
					}

					if (!explicitStyles && JsonText.hasSameStyle(style, parentStyle)) {
						output.push(element)
						break
					}
					output.push({ ...parentStyle, text: element })
					break

				case typeof element === 'object': {
					const style = JsonText.getComponentStyle(element, parentStyle)
					const processed = { ...element }
					delete processed.with
					delete processed.extra
					output.push({ ...style, ...processed })

					const { with: withArray = [], extra: extraArray = [] } = element

					if (withArray.length > 0) {
						processComponent(withArray, style)
					}
					if (extraArray.length > 0) {
						processComponent(extraArray, style)
					}
					break
				}

				default:
					console.warn('Unknown component type in flatten:', element)
					break
			}
		}

		processComponent(this.content)
		return output
	}

	static getComponentStyle(
		component: TextElement,
		parentStyle: ComponentStyle = JsonText.defaultStyle
	): ComponentStyle {
		switch (true) {
			case Array.isArray(component):
				if (component.length === 0) return { ...parentStyle }
				return JsonText.getComponentStyle(component[0], parentStyle)

			case typeof component === 'string':
				return { ...parentStyle }

			case typeof component === 'object': {
				const style = { ...parentStyle }
				for (const key of Object.values(STYLE_KEYS)) {
					if (component[key] === undefined) continue
					style[key] = component[key] as any
				}
				return style
			}

			default:
				console.warn('Unknown component type in getComponentStyle:', component)
				return { ...parentStyle }
		}
	}

	static hasSameStyle(a: ComponentStyle, b: ComponentStyle): boolean {
		for (const key of Object.values(STYLE_KEYS)) {
			if (a[key] !== b[key]) return false
		}
		return true
	}

	static intToRgba(color: number): [number, number, number, number] {
		const a = (color >> 24) & 0xff
		const r = (color >> 16) & 0xff
		const g = (color >> 8) & 0xff
		const b = color & 0xff
		return [r / 255, g / 255, b / 255, a / 255]
	}

	static rgbaToInt([r, g, b, a]: [number, number, number, number]): number {
		r = Math.floor(r * 255)
		g = Math.floor(g * 255)
		b = Math.floor(b * 255)
		a = Math.floor(a * 255)
		return (a << 24) | (r << 16) | (g << 8) | b
	}

	static intToHex8(color: number): string {
		return `#${(color >>> 0).toString(16).padStart(8, '0')}`
	}

	static hexToRgba(hex: string): [number, number, number, number] {
		return JsonText.intToRgba(JsonText.hexToInt(hex))
	}

	static hexToInt(hex: string): number {
		if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 9)) {
			throw new Error('Invalid hex color format. Expected #RRGGBB or #AARRGGBB.')
		}
		if (hex.length === 7) {
			hex = '#ff' + hex.slice(1) // Add alpha
		}
		return parseInt(hex.slice(1), 16)
	}

	static getColor(color: TextObjectColor | TextObjectShadowColor): tinycolor.Instance {
		if (Array.isArray(color)) {
			return tinycolor({
				r: color[0] * 255,
				g: color[1] * 255,
				b: color[2] * 255,
				a: color[3] ?? 1 * 255,
			})
		} else if (typeof color === 'number') {
			const rgba = JsonText.intToRgba(color)
			return tinycolor({
				r: rgba[0] * 255,
				g: rgba[1] * 255,
				b: rgba[2] * 255,
				a: rgba[3] * 255,
			})
		} else if (color.startsWith('#')) {
			return tinycolor(color)
		} else if (color in COLOR_VALUES) {
			return tinycolor(COLOR_VALUES[color as keyof typeof COLOR_VALUES])
		} else {
			console.warn('Unknown color:', color)
			return tinycolor('white')
		}
	}

	/**
	 * Attempts to parse a stringified Json Text Component.
	 *
	 * Supports SNBT-based Json Text from 1.21.5+
	 */
	static fromString(
		str: string,
		options?: ConstructorParameters<typeof JsonTextParser>[0]
	): JsonText | undefined {
		const parser = new JsonTextParser(options)
		return parser.parse(str)
	}
}
