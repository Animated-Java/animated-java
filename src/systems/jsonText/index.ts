import { MinecraftVersion } from '../global'
import { JsonTextParser } from './parser'
import { JsonTextStringifier } from './stringifier'
export { COLOR_MAP } from './parser'

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

export type ComponentStyle = Pick<BaseComponent, STYLE_KEYS>

export type Color =
	| 'dark_red'
	| 'red'
	| 'gold'
	| 'yellow'
	| 'dark_green'
	| 'green'
	| 'aqua'
	| 'dark_aqua'
	| 'dark_blue'
	| 'blue'
	| 'light_purple'
	| 'dark_purple'
	| 'white'
	| 'gray'
	| 'dark_gray'
	| 'black'
	| `#${string}`

export interface ClickEvent {
	action:
		| 'open_url'
		| 'open_file'
		| 'run_command'
		| 'suggest_command'
		| 'change_page'
		| 'copy_to_clipboard'
	value: string
}

export type HoverEvent =
	| { action: 'show_text'; contents: Component }
	| {
			action: 'show_item'
			contents: {
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
				id: string
				name?: string
			}
	  }

export type ClickEvent_1_21_5 =
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

export type HoverEvent_1_21_5 =
	| {
			action: 'show_text'
			value: Component
	  }
	| {
			action: 'show_item'
			id: string
			count?: number
			// Text displays dont support hover events anyway,
			// so I'll just ignore this for now.
			components?: string
	  }
	| {
			action: 'show_entity'
			name?: string
			id: string
			uuid: string | [number, number, number, number]
	  }

export type BaseComponent = {
	type?: string

	font?: string
	color?: Color
	bold?: boolean
	italic?: boolean
	underlined?: boolean
	strikethrough?: boolean
	obfuscated?: boolean

	extra?: Component[]
	insertion?: string

	// before 1.21.5
	clickEvent?: ClickEvent
	hoverEvent?: HoverEvent

	// since 1.21.5
	shadow_color?: number | [number, number, number, number]
	click_event?: ClickEvent_1_21_5
	hover_event?: HoverEvent_1_21_5
}

export interface TextComponent {
	type?: 'text'
	text: string
}

export type TranslatableTextComponent = {
	type?: 'translatable'
	translate: string
	fallback?: string
	with?: Component[]
}

export interface ScoreComponent {
	type?: 'score'
	score: {
		name: string
		objective: string
	}
}

export interface SelectorComponent {
	type?: 'selector'
	selector: string
	separator?: string
}

export interface KeybindComponent {
	type?: 'keybind'
	keybind: string
}

export interface BlockNbtComponent {
	type?: 'nbt'
	nbt: string
	block: string
}

export interface EntityNbtComponent {
	type?: 'nbt'
	nbt: string
	entity: string
}

export interface StorageNbtComponent {
	type?: 'nbt'
	nbt: string
	storage: string
}

export type CompositeComponent = BaseComponent &
	Partial<
		TextComponent &
			TranslatableTextComponent &
			ScoreComponent &
			SelectorComponent &
			KeybindComponent &
			BlockNbtComponent &
			EntityNbtComponent &
			StorageNbtComponent
	>

export type Component = string | Component[] | CompositeComponent

export class JsonText {
	static defaultTargetVersion: MinecraftVersion = '1.20.4'

	isJsonTextClass = true
	content: Component

	constructor(jsonText: Component) {
		this.content = jsonText
	}

	toString(targetMinecraftVersion: MinecraftVersion = JsonText.defaultTargetVersion) {
		return new JsonTextStringifier(this.content, targetMinecraftVersion).stringify()
	}

	toJSON(): Component {
		return structuredClone(this.content)
	}

	static getComponentStyle(
		component: Component,
		parentStyle: ComponentStyle = {}
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

	/**
	 * Returns a flattened version of this JsonText.
	 */
	flatten(): Array<string | CompositeComponent> {
		const output: Array<string | CompositeComponent> = []

		const processComponent = (component: Component, parentStyle: ComponentStyle = {}) => {
			switch (true) {
				case Array.isArray(component): {
					// "Parent" style is inherited from the first item of the array
					const style = JsonText.getComponentStyle(component, parentStyle)
					for (const child of component) {
						processComponent(child, style)
					}
					break
				}

				case typeof component === 'string':
					if (Object.keys(parentStyle).length === 0) {
						output.push(component)
						break
					}
					output.push({ ...parentStyle, text: component })
					break

				case typeof component === 'object': {
					const style = JsonText.getComponentStyle(component, parentStyle)
					const processed = { ...component }
					delete processed.with
					delete processed.extra
					output.push({ ...style, ...processed })

					const { with: withArray = [], extra: extraArray = [] } = component

					if (withArray.length > 0) {
						processComponent(withArray, style)
					}
					if (extraArray.length > 0) {
						processComponent(extraArray, style)
					}
					break
				}

				default:
					console.warn('Unknown component type in flatten:', component)
					break
			}
		}

		processComponent(this.content)
		return output
	}

	/**
	 * Attempts to parse a stringified Json Text Component.
	 *
	 * Supports SNBT-based Json Text from 1.21.5+
	 */
	static fromString(
		str: string,
		targetMinecraftVersion: MinecraftVersion = JsonText.defaultTargetVersion
	): JsonText | undefined {
		const parser = new JsonTextParser(str, targetMinecraftVersion)
		return parser.parse()
	}
}
