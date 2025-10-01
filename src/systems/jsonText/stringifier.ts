import {
	type ClickEvent,
	type ClickEvent_1_21_5,
	type Component,
	type CompositeComponent,
	type HoverEvent,
	type HoverEvent_1_21_5,
	type ScoreComponent,
} from '.'
import { type MinecraftVersion } from '../global'

export class JsonTextStringifier {
	private enforceDoubleQuotes = false
	private useModernClickEventFormat = false
	private useModernHoverEventFormat = false
	/** Transform '\s' to spaces in strings */
	private resolveSpaceEscapeSequences = false

	constructor(private element: Component, private targetMinecraftVersion: MinecraftVersion) {
		if (compareVersions('1.21.5', this.targetMinecraftVersion)) {
			this.enforceDoubleQuotes = true
			this.useModernClickEventFormat = false
			this.useModernHoverEventFormat = false
			this.resolveSpaceEscapeSequences = true
		}
	}

	stringify(): string {
		return this.stringifyComponent(this.element)
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
		if (this.resolveSpaceEscapeSequences) {
			str = str.replaceAll('\\s', ' ')
		}

		// Remove escaped quotes for accurate detection
		const unescaped = str.replace(/\\'/g, "'").replace(/\\"/g, '"')
		const hasSingle = unescaped.includes("'")
		const hasDouble = unescaped.includes('"')

		if (this.enforceDoubleQuotes) {
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

	private stringifyComponentArray(arr: Component[]): string {
		return `[${arr.map(e => this.stringifyComponent(e)).join(',')}]`
	}

	private stringifyScoreObject(score: ScoreComponent['score']): string {
		if (this.enforceDoubleQuotes) {
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

	private stringifyHoverEvent(event: HoverEvent): string {
		if (this.useModernHoverEventFormat) {
			throw new Error(
				`Minecraft ${this.targetMinecraftVersion} does not support hoverEvents. Use hover_event instead.`
			)
		}

		switch (event.action) {
			case 'show_text': {
				return `{"action":"show_text","contents":${this.stringifyComponent(
					event.contents
				)}}`
			}

			case 'show_item': {
				let result = `{"action":"show_item","contents":{"id":${this.stringifyString(
					event.contents.id
				)}`

				if (event.contents.count !== undefined) {
					result += `,"count":${event.contents.count}`
				}
				if (event.contents.tag !== undefined) {
					result += `,"tag":${this.stringifyComponent(event.contents.tag)}`
				}

				return result + `}}`
			}

			case 'show_entity': {
				let result = `{"action":"show_entity","contents":{"type":${this.stringifyString(
					event.contents.type
				)},"id":${this.stringifyString(event.contents.id)}`

				if (event.contents.name !== undefined) {
					result += `,"name":${this.stringifyComponent(event.contents.name)}`
				}

				return result + `}}`
			}
		}
	}

	private stringify1_21_5HoverEvent(event: HoverEvent_1_21_5): string {
		if (!this.useModernHoverEventFormat) {
			throw new Error(
				`Minecraft ${this.targetMinecraftVersion} does not support hover_events. Use hoverEvent instead.`
			)
		}

		switch (event.action) {
			case 'show_text': {
				return `{action:show_text,value:${this.stringifyComponent(event.action)}}`
			}
			case 'show_item': {
				let result = `{action:show_item,id:${this.stringifyString(event.id)}`

				if (event.count !== undefined) {
					result += `,count:${event.count}`
				}

				if (event.components !== undefined) {
					result += `,components:${this.stringifyString(event.components)}`
				}

				return result + `}`
			}
			case 'show_entity': {
				let result = `{action:show_entity,id:${this.stringifyString(event.id)}`

				if (event.name !== undefined) {
					result += `,name:${this.stringifyComponent(event.name)}`
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

	private stringifyClickEvent(event: ClickEvent): string {
		if (this.useModernClickEventFormat) {
			throw new Error(
				`Minecraft ${this.targetMinecraftVersion} does not support clickEvents. Use click_event instead.`
			)
		}
		return `{"action":"${event.action}","value":${this.stringifyString(event.value)}}`
	}

	private stringify1_21_5ClickEvent(event: ClickEvent_1_21_5): string {
		if (this.useModernClickEventFormat) {
			throw new Error(
				`Minecraft ${this.targetMinecraftVersion} does not support click_events. Use clickEvent instead.`
			)
		}

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
					result += `,payload:${this.stringifyComponent(event.payload)}`
				}

				return result + `}`
		}
	}

	private stringifyCompositeComponent(obj: CompositeComponent): string {
		const entries: string[] = []

		for (let [key, value] of Object.entries(obj) as [
			keyof CompositeComponent,
			CompositeComponent[keyof CompositeComponent]
		][]) {
			// Quote character to use for keys
			const q = this.enforceDoubleQuotes ? '"' : ''

			if (Array.isArray(value)) {
				if (typeof value[0] === 'number') {
					entries.push(`${q + key + q}:${JSON.stringify(value)}`)
				} else {
					// @ts-expect-error - Cannot remove [number, number, number, number] type
					entries.push(`${q + key + q}:${this.stringifyComponent(value)}`)
				}
			} else if (typeof value === 'object') {
				switch (key) {
					case 'hoverEvent': {
						entries.push(`${q + key + q}:${this.stringifyHoverEvent(value as any)}`)
						break
					}
					case 'hover_event': {
						entries.push(
							`${q + key + q}:${this.stringify1_21_5HoverEvent(value as any)}`
						)
						break
					}
					case 'clickEvent': {
						entries.push(`${q + key + q}:${this.stringifyClickEvent(value as any)}`)
						break
					}
					case 'click_event': {
						entries.push(
							`${q + key + q}:${this.stringify1_21_5ClickEvent(value as any)}`
						)
						break
					}
					case 'score': {
						entries.push(`${q + key + q}:${this.stringifyScoreObject(value as any)}`)
						break
					}
					default: {
						entries.push(`${q + key + q}:${this.stringifyComponent(value as any)}`)
						break
					}
				}
			} else if (typeof value === 'string') {
				entries.push(`${q + key + q}:${this.stringifyString(value)}`)
			} else if (value != undefined) {
				entries.push(`${q + key + q}:${value}`)
			} else {
				console.warn('Undefined value in JsonTextStringifier:', key, value)
			}
		}

		return `{${entries.join(',')}}`
	}

	private stringifyComponent(element: Component): string {
		if (typeof element === 'string') {
			return this.stringifyString(element)
		} else if (Array.isArray(element)) {
			return this.stringifyComponentArray(element)
		} else if (typeof element === 'object' && element !== null) {
			return this.stringifyCompositeComponent(element)
		} else {
			console.error(element)
			throw new Error('Invalid JsonTextElement')
		}
	}
}
