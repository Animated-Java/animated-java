import { StringStream } from 'generic-stream'
import {
	ClickEvent,
	ClickEvent_1_21_5,
	Component,
	HoverEvent,
	HoverEvent_1_21_5,
	JsonText,
	ScoreComponent,
	type Color,
	type CompositeComponent,
} from '.'
import { MinecraftVersion } from '../global'

type OneLessThan<N extends number> = N extends 1
	? 0
	: N extends 2
	? 1
	: N extends 3
	? 2
	: N extends 4
	? 3
	: N extends 5
	? 4
	: N extends 6
	? 5
	: N extends 7
	? 6
	: N extends 8
	? 7
	: N extends 9
	? 8
	: never

type FixedLengthArray<T, L extends number> = L extends 0
	? []
	: [T, ...FixedLengthArray<T, OneLessThan<L>>]

export const COLOR_MAP: Record<string, string> = {
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
}

export class JsonParserError extends Error {
	private _originalMessage: string

	constructor(
		message: string,
		public stream: StringStream,
		public child?: Error,
		public line = stream.line,
		public column = stream.column,
		public pointerLength = 1
	) {
		super(message)

		this._originalMessage = message

		if (this.child) {
			this.message = `${this.message} at ${this.line}:${this.column}\n${this.child.message}`
			return
		}

		this.updatePointerMessage()
	}

	getOriginErrorMessage(): string {
		if (this.child) {
			if (this.child instanceof JsonParserError) {
				return this.child.getOriginErrorMessage()
			}
			return this.child.message
		}
		return this.message
	}

	updatePointerMessage() {
		// Unexpected '}' at 1:5
		// Hello, World!"}
		//               ↑

		// Complete the line
		const startOfLine = this.stream.lines[this.line - 1].startIndex
		const endOfLine = this.stream.seek('\n')

		const lineString = this.stream.string.slice(startOfLine, endOfLine).trimEnd()

		// Get column where tabs count as 4 characters
		const actualColumn = lineString.slice(0, this.column - 1).replace(/\t/g, '    ').length + 1

		const pointer = ' '.repeat(actualColumn - 1) + '↑'.repeat(this.pointerLength)
		this.message = `${this._originalMessage} at ${this.line}:${this.column}\n${lineString}\n${pointer}`
	}
}

namespace CHARS {
	export const ALPHA_LOWER = Array.from('abcdefghijklmnopqrstuvwxyz')
	export const ALPHA_UPPER = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
	export const ALPHA = ALPHA_LOWER.concat(ALPHA_UPPER)
	export const NUMBER = Array.from('0123456789')
	export const ALPHANUMERIC = ALPHA.concat(NUMBER)
	export const VERTICAL_WHITESPACE = Array.from('\n\r')
	export const WHITESPACE = Array.from(' \t').concat(VERTICAL_WHITESPACE)
	// This parser only parses SNBT-based JSON text components, so we don't need to support all SNBT unquoted string characters.
	export const UNQUOTED_STRING = ALPHANUMERIC.concat('_')
	export const UNQUOTED_STRING_START = ALPHA.concat('_')
	export const STRING_QUOTE = Array.from(`"'`)
	export const HEXADECIMAL = NUMBER.concat(Array.from('abcdef'), Array.from('ABCDEF'))
	export const SYNTAX_BOUNDARY = WHITESPACE.concat(Array.from(',:]}'))
}

export class JsonTextParser {
	private s: StringStream

	constructor(public text: string, public targetMinecraftVersion: MinecraftVersion) {
		this.s = new StringStream(text)
	}

	parse(): JsonText {
		const result = this.parseTextElement()

		this.consumeWhitespace()

		if (this.s.item) {
			throw new JsonParserError(
				`Unexpected trailing '${this.s.item}' after JsonTextElement`,
				this.s
			)
		}

		return new JsonText(result)
	}

	private consumeWhitespace() {
		this.s.consumeWhile(s => !!s.item && CHARS.WHITESPACE.includes(s.item))
	}

	private parseTextElement(): Component {
		let result: Component

		this.consumeWhitespace()

		if (this.s.item === '{') {
			result = this.parseTextObject()
		} else if (this.s.item === '[') {
			result = this.parseArray(this.parseTextElement.bind(this))
		} else if (
			!this.s.item ||
			CHARS.STRING_QUOTE.includes(this.s.item) ||
			CHARS.UNQUOTED_STRING_START.includes(this.s.item)
		) {
			result = this.parseString()
		} else {
			throw new JsonParserError(`Unexpected '${this.s.item}' in JsonTextElement`, this.s)
		}

		return result
	}

	private parseObject<T>(
		valueParser: (key: keyof T, obj: T) => void,
		validator?: (obj: T) => void
	): T {
		const { line, column } = this.s
		const keys = new Set<keyof T>()

		try {
			this.expect(this.s.item, '{', 'to begin JsonTextObject', true)
			this.consumeWhitespace()
			const obj: any = {}
			while (this.s.item !== '}') {
				const { line: keyLine, column: keyColumn } = this.s
				const key = this.parseString() as keyof T
				if (keys.has(key)) {
					throw new JsonParserError(
						`Duplicate key '${String(key)}'`,
						this.s,
						undefined,
						keyLine,
						keyColumn,
						String(key).length
					)
				}
				keys.add(key)
				this.consumeWhitespace()

				this.expect(this.s.item, ':', `to follow key '${String(key)}'`, true)
				this.consumeWhitespace()

				valueParser(key, obj)
				this.expectSyntaxBoundaryAfter(`value for '${String(key)}'`)
				this.consumeWhitespace()

				if (this.s.item === ',') {
					this.s.consume()
					this.consumeWhitespace()
					if (this.s.item === ',') {
						throw new JsonParserError(`Extra comma`, this.s)
					}
				} else if (this.s.item === '}') {
					break
				} else if (this.s.item === undefined) {
					throw new JsonParserError('Unexpected EOF in JsonTextObject', this.s)
				} else {
					throw new JsonParserError(
						`Unexpected '${this.s.item}' in JsonTextObject`,
						this.s
					)
				}
			}
			this.s.consume() // }

			if (validator) {
				try {
					validator(obj)
				} catch (e: any) {
					if (e instanceof JsonParserError) {
						if (e.line === this.s.line && e.column === this.s.column) {
							// Point the error to the start of the object instead of the end
							e.line = line
							e.column = column
							e.updatePointerMessage()
						}
					}
					throw e
				}
			}

			return obj
		} catch (e: any) {
			throw new JsonParserError('Invalid JsonTextObject', this.s, e as Error, line, column)
		}
	}

	private parseTextObject() {
		return this.parseObject<CompositeComponent>(
			(key, obj) => {
				switch (key) {
					case 'block':
					case 'entity':
					case 'font':
					case 'insertion':
					case 'keybind':
					case 'nbt':
					case 'selector':
					case 'separator':
					case 'storage':
					case 'text':
					case 'translate':
					case 'fallback':
						obj[key] = this.parseString()
						break

					case 'color': {
						const color = this.parseString() as Color
						if (!(COLOR_MAP[color] || color.startsWith('#'))) {
							throw new JsonParserError(`Unknown color '${color}'`, this.s)
						}
						obj.color = color
						break
					}

					case 'shadow_color': {
						if (compareVersions(this.targetMinecraftVersion, '1.21.4')) {
							throw new JsonParserError(
								`Minecraft ${this.targetMinecraftVersion} does not support shadow_color.`,
								this.s
							)
						}

						if ((this.s.item as string) === '[') {
							const rgba = this.parseArray(this.parseFloat.bind(this), 4)
							for (const n of rgba) {
								if (typeof n !== 'number' || n < 0 || n > 1) {
									throw new JsonParserError(
										`shadow_color array values must be numbers between 0 and 1`,
										this.s
									)
								}
							}
							obj.shadow_color = rgba
							break
						} else if (CHARS.NUMBER.includes(this.s.item as string)) {
							const rgba = this.parseFloat()
							if (typeof rgba !== 'number' || rgba < 0 || rgba > 0xffffffff) {
								throw new JsonParserError(
									`shadow_color value must be a number between 0 and 0xffffffff`,
									this.s
								)
							}
							// Convert from int color to rgba array
							const r = (rgba >> 24) & 0xff
							const g = (rgba >> 16) & 0xff
							const b = (rgba >> 8) & 0xff
							const a = rgba & 0xff
							obj.shadow_color = [r / 255, g / 255, b / 255, a / 255]
							break
						}
						const color = this.parseString() as Color
						if (!(COLOR_MAP[color] || color.startsWith('#'))) {
							throw new JsonParserError(`Unknown color '${color}'`, this.s)
						}
						const hex = color.startsWith('#') ? color : COLOR_MAP[color]
						const rgba = new tinycolor(hex).toRgb()
						// Apparently shadow color is actually a rgba value now... Dumb.
						obj.shadow_color = [rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a / 255]
						break
					}

					case 'bold':
					case 'italic':
					case 'obfuscated':
					case 'strikethrough':
					case 'underlined':
						obj[key] = this.parseBoolean()
						break

					case 'with':
					case 'extra':
						obj[key] = this.parseArray(this.parseTextElement.bind(this))
						break

					case 'score':
						obj[key] = this.parseScoreObject()
						break

					case 'clickEvent':
						if (!compareVersions('1.21.5', this.targetMinecraftVersion)) {
							throw new JsonParserError(
								`Minecraft ${this.targetMinecraftVersion} does not support 'clickEvents'. Use 'click_event' instead`,
								this.s
							)
						}
						obj[key] = this.parseClickEventObject()
						break

					case 'click_event':
						if (compareVersions('1.21.5', this.targetMinecraftVersion)) {
							throw new JsonParserError(
								`Minecraft ${this.targetMinecraftVersion} does not support 'click_events'. Use 'clickEvent' instead`,
								this.s
							)
						}
						obj[key] = this.parse1_21_5ClickEventObject()
						break

					case 'hoverEvent':
						if (!compareVersions('1.21.5', this.targetMinecraftVersion)) {
							throw new JsonParserError(
								`Minecraft ${this.targetMinecraftVersion} does not support 'hoverEvents'. Use 'hover_event' instead`,
								this.s
							)
						}
						obj[key] = this.parseHoverEventObject()
						break

					case 'hover_event':
						if (compareVersions('1.21.5', this.targetMinecraftVersion)) {
							throw new JsonParserError(
								`Minecraft ${this.targetMinecraftVersion} does not support 'hover_events'. Use 'hoverEvent' instead`,
								this.s
							)
						}
						obj[key] = this.parse1_21_5HoverEventObject()
						break

					default:
						throw new JsonParserError(`Unknown key '${key}' in JsonTextObject`, this.s)
				}
			},
			obj => {
				// Make sure the object has at least one of the required keys
				if (
					obj.text === undefined &&
					obj.translate === undefined &&
					obj.score === undefined &&
					obj.selector === undefined &&
					obj.keybind === undefined &&
					obj.nbt === undefined
				) {
					throw new JsonParserError(
						`JsonTextObject does not include one of 'text', 'translate', 'score', 'selector', 'keybind', or 'nbt'.`,
						this.s
					)
				}

				// Validate the NBT key
				if (
					obj.nbt !== undefined &&
					obj.block === undefined &&
					obj.entity === undefined &&
					obj.storage === undefined
				) {
					throw new JsonParserError(
						`JsonTextObject includes 'nbt' but does not include one of 'block', 'entity', or 'storage'.`,
						this.s
					)
				}
			}
		)
	}

	private parseScoreObject() {
		return this.parseObject<ScoreComponent['score']>(
			(key, obj) => {
				switch (key) {
					case 'name':
					case 'objective':
						obj[key] = this.parseString()
						break
					default:
						throw new JsonParserError(
							`Unknown key '${key}' in JsonTextObject.score`,
							this.s
						)
				}
			},
			obj => {
				if (obj.name === undefined || obj.objective === undefined) {
					throw new JsonParserError(
						`JsonTextObject.score must include 'name' and 'objective'`,
						this.s
					)
				}
			}
		)
	}

	private parseClickEventObject() {
		return this.parseObject(
			(key, obj: ClickEvent) => {
				switch (key) {
					case 'action':
						obj[key] = this.parseString([
							'open_url',
							'open_file',
							'run_command',
							'suggest_command',
							'change_page',
							'copy_to_clipboard',
						])
						break
					case 'value':
						obj[key] = this.parseString()
						break
					default:
						throw new JsonParserError(
							`Unknown key '${key}' in JsonTextObject.clickEvent`,
							this.s
						)
				}
			},
			obj => {
				if (obj.action === undefined) {
					throw new JsonParserError(
						`JsonTextObject.clickEvent must include 'action'`,
						this.s
					)
				} else if (obj.value === undefined) {
					throw new JsonParserError(
						`JsonTextObject.clickEvent must include 'value'`,
						this.s
					)
				}
			}
		)
	}

	private parseHoverEventObjectShowItemContents() {
		return this.parseObject<(HoverEvent & { action: 'show_item' })['contents']>(
			(key, item) => {
				switch (key) {
					case 'id':
						item[key] = this.parseString()
						break
					case 'count':
						item[key] = this.parseFloat()
						break
					case 'tag':
						item[key] = this.parseString()
						break
					default:
						throw new JsonParserError(
							`Unknown key '${key}' in JsonTextObject.itemHoverEvent.contents`,
							this.s
						)
				}
			},
			obj => {
				if (obj.id === undefined) {
					throw new JsonParserError(
						`JsonTextObject.itemHoverEvent.contents must include 'id'`,
						this.s
					)
				}
			}
		)
	}

	private parse1_21_5ClickEventObject() {
		const valueParser = (key: string, obj: ClickEvent_1_21_5) => {
			switch (key) {
				case 'action':
					obj[key] = this.parseString([
						'open_url',
						'open_file',
						'run_command',
						'suggest_command',
						'change_page',
						'copy_to_clipboard',
						'show_dialog',
						'custom',
					])
					if (obj[key] === 'show_dialog') {
						throw new JsonParserError(
							`'show_dialog' click_event is not supported`,
							this.s
						)
					}
					break

				case 'url':
					if (obj.action !== 'open_url') {
						throw new JsonParserError(
							`'url' is only valid when click_event action is 'open_url'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'path':
					if (obj.action !== 'open_file') {
						throw new JsonParserError(
							`'path' is only valid when click_event action is 'open_file'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'command':
					if (obj.action !== 'run_command' && obj.action !== 'suggest_command') {
						throw new JsonParserError(
							`'command' is only valid when click_event action is 'run_command' or 'suggest_command'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'page':
					if (obj.action !== 'change_page') {
						throw new JsonParserError(
							`'page' is only valid when click_event action is 'change_page'`,
							this.s
						)
					}
					obj[key] = this.parseFloat()
					break

				case 'value':
					if (obj.action !== 'copy_to_clipboard') {
						throw new JsonParserError(
							`'value' is only valid when click_event action is 'copy_to_clipboard'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'dialog':
					if (obj.action !== 'show_dialog') {
						throw new JsonParserError(
							`'dialog' is only valid when click_event action is 'show_dialog'`,
							this.s
						)
					}
					throw new JsonParserError(
						`click_events of type 'show_dialog' are not supported`,
						this.s
					)
					break

				case 'id':
					if (obj.action !== 'custom') {
						throw new JsonParserError(
							`'id' is only valid when click_event action is 'custom'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'payload':
					if (obj.action !== 'custom') {
						throw new JsonParserError(
							`'payload' is only valid when click_event action is 'custom'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break
			}
		}

		const validator = (obj: ClickEvent_1_21_5) => {
			if (obj.action === undefined) {
				throw new JsonParserError(`'click_event' must include 'action'`, this.s)
			}

			switch (obj.action) {
				case 'open_url':
					if (obj.url === undefined) {
						throw new JsonParserError(
							`click_event of type 'open_url' missing required key 'url'`,
							this.s
						)
					}
					break

				case 'open_file':
					if (obj.path === undefined) {
						throw new JsonParserError(
							`click_event of type 'open_file' missing required key 'path'`,
							this.s
						)
					}
					break

				case 'run_command':
					if (obj.command === undefined) {
						throw new JsonParserError(
							`click_event of type 'run_command' missing required key 'command'`,
							this.s
						)
					}
					break

				case 'suggest_command':
					if (obj.command === undefined) {
						throw new JsonParserError(
							`click_event of type 'suggest_command' missing required key 'command'`,
							this.s
						)
					}
					break

				case 'change_page':
					if (obj.page === undefined) {
						throw new JsonParserError(
							`click_event of type 'change_page' missing required key 'page'`,
							this.s
						)
					}
					break

				case 'copy_to_clipboard':
					if (obj.value === undefined) {
						throw new JsonParserError(
							`click_event of type 'copy_to_clipboard' missing required key 'value'`,
							this.s
						)
					}
					break

				case 'custom':
					if (obj.id === undefined) {
						throw new JsonParserError(
							`click_event of type 'custom' missing required key 'id'`,
							this.s
						)
					}
					break

				case 'show_dialog':
					throw new JsonParserError(
						`click_events of type 'show_dialog' are not supported`,
						this.s
					)
			}
		}

		return this.parseObject(valueParser, validator)
	}

	private parse1_21_5HoverEventObject() {
		const valueParser = (key: string, obj: HoverEvent_1_21_5) => {
			switch (key) {
				case 'action':
					obj[key] = this.parseString(['show_text', 'show_item', 'show_entity'])
					break

				case 'value':
					if (obj.action !== 'show_text') {
						throw new JsonParserError(
							`'value' is only valid when hover_event action is 'show_text'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'id':
					if (obj.action !== 'show_item' && obj.action !== 'show_entity') {
						throw new JsonParserError(
							`'id' is only valid when hover_event action is 'show_item' or 'show_entity'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'count':
					if (obj.action !== 'show_item') {
						throw new JsonParserError(
							`'count' is only valid when hover_event action is 'show_item'`,
							this.s
						)
					}
					obj[key] = this.parseFloat()
					break

				case 'components':
					if (obj.action !== 'show_item') {
						throw new JsonParserError(
							`'components' is only valid when hover_event action is 'show_item'`,
							this.s
						)
					}
					throw new JsonParserError(
						`'components' key in hover_event is not supported`,
						this.s
					)
					break

				case 'name':
					if (obj.action !== 'show_entity') {
						throw new JsonParserError(
							`'name' is only valid when hover_event action is 'show_entity'`,
							this.s
						)
					}
					obj[key] = this.parseString()
					break

				case 'uuid':
					if (obj.action !== 'show_entity') {
						throw new JsonParserError(
							`'uuid' is only valid when hover_event action is 'show_entity'`,
							this.s
						)
					}
					if (this.s.item === '[') {
						const array = this.parseIntArray(false, 4)
						obj[key] = array
					} else {
						obj[key] = this.parseString()
					}
					break
			}
		}

		const validator = (obj: HoverEvent_1_21_5) => {
			if (obj.action === undefined) {
				throw new JsonParserError(`'hover_event' must include 'action'`, this.s)
			}

			switch (obj.action) {
				case 'show_text':
					if (obj.value === undefined) {
						throw new JsonParserError(
							`hover_event of type 'show_text' missing required key 'value'`,
							this.s
						)
					}
					break

				case 'show_item':
					if (obj.id === undefined) {
						throw new JsonParserError(
							`hover_event of type 'show_item' missing required key 'id'`,
							this.s
						)
					}
					break

				case 'show_entity':
					if (obj.id === undefined) {
						throw new JsonParserError(
							`hover_event of type 'show_entity' missing required key 'id'`,
							this.s
						)
					}
					if (obj.uuid === undefined) {
						throw new JsonParserError(
							`hover_event of type 'show_entity' missing required key 'uuid'`,
							this.s
						)
					}
					break
			}
		}

		return this.parseObject(valueParser, validator)
	}

	private parseHoverEventObjectShowEntityContents() {
		return this.parseObject<(HoverEvent & { action: 'show_entity' })['contents']>(
			(key, entity) => {
				switch (key) {
					case 'type':
						entity[key] = this.parseString()
						break
					case 'id':
						entity[key] = this.parseString()
						break
					case 'name':
						entity[key] = this.parseString()
						break
					default:
						throw new JsonParserError(
							`Unknown key '${key}' in JsonTextObject.entityHoverEvent.contents`,
							this.s
						)
				}
			},
			obj => {
				if (obj.type === undefined) {
					throw new JsonParserError(
						`JsonTextObject.entityHoverEvent.contents must include 'type'`,
						this.s
					)
				}
			}
		)
	}

	private parseHoverEventObject() {
		return this.parseObject<HoverEvent>(
			(key, obj) => {
				switch (key) {
					case 'action':
						obj[key] = this.parseString(['show_text', 'show_item', 'show_entity'])
						break
					case 'contents':
						switch (obj.action) {
							case undefined: {
								throw new JsonParserError(
									`'action' must be defined before 'contents' in hoverEvent`,
									this.s
								)
							}
							case 'show_text': {
								obj[key] = this.parseTextElement()
								break
							}
							case 'show_item': {
								obj[key] = this.parseHoverEventObjectShowItemContents()
								break
							}
							case 'show_entity': {
								obj[key] = this.parseHoverEventObjectShowEntityContents()
								break
							}
						}
						break
					default:
						throw new JsonParserError(
							`Unknown key '${key}' in JsonTextObject.hoverEvent`,
							this.s
						)
				}
			},
			obj => {
				if (obj.action === undefined) {
					throw new JsonParserError(
						`JsonTextObject.hoverEvent must include 'action'`,
						this.s
					)
				} else if (obj.contents === undefined) {
					throw new JsonParserError(
						`JsonTextObject.hoverEvent must include 'contents'`,
						this.s
					)
				}
			}
		)
	}

	private parseArray<T>(valueParser: () => T): T[]
	private parseArray<T, L extends number>(
		valueParser: () => T,
		expectedLength?: L
	): L extends number ? FixedLengthArray<T, L> : T[]
	private parseArray<T, L extends number>(
		valueParser: () => T,
		expectedLength?: L
	): T[] | FixedLengthArray<T, L> {
		this.expect(this.s.item, '[', 'to begin JsonTextArray', true)

		this.consumeWhitespace()
		const array: T[] = []
		while (this.s.item !== ']') {
			this.consumeWhitespace()
			const value = valueParser()
			array.push(value)
			this.expectSyntaxBoundaryAfter('array element')
			const { line, column } = this.s
			this.consumeWhitespace()

			if (expectedLength !== undefined && array.length > expectedLength) {
				throw new JsonParserError(
					`Too many elements in array (expected ${expectedLength})`,
					this.s,
					undefined,
					line,
					column
				)
			}

			if (this.s.item === ',') {
				this.s.consume()
				this.consumeWhitespace()
				if (this.s.item === ',') {
					throw new JsonParserError(`Extra comma`, this.s)
				}
			} else if (this.s.item === ']') {
				break
			} else if (this.s.item === undefined) {
				throw new JsonParserError('Unexpected EOF in JsonTextArray', this.s)
			} else {
				throw new JsonParserError(
					`Expected comma or closing bracket after array element`,
					this.s,
					undefined,
					line,
					column
				)
			}
		}
		this.s.consume() // ]
		return array
	}

	private parseIntArray<L extends number>(requireTypeIdentifier?: boolean, length?: L) {
		this.expect(this.s.item, '[', 'to begin int-array', true)
		if (this.s.item === 'I') {
			this.s.consume()
			this.expect(this.s.item, ';', 'to follow array type identifier', true)
		} else if (requireTypeIdentifier) {
			throw new JsonParserError(`Expected explicit int-array`, this.s)
		}

		return this.parseArray(this.parseInt.bind(this), length)
	}

	private collectHexDigits(count: number): string {
		let hex = ''
		for (let i = 0; i < count; i++) {
			if (this.s.item && CHARS.HEXADECIMAL.includes(this.s.item)) {
				hex += this.s.item
				this.s.consume()
			} else {
				throw new JsonParserError(
					`Unexpected '${this.s.item!}' in ${count}-digit hex escape sequence`,
					this.s
				)
			}
		}
		return hex
	}

	// Validates and returns a string representation of the escape sequence.
	// The renderer, such as Minecraft, will handle the actual escape sequence resolution.
	private parseNamedUnicodeEscapeSequence(): string {
		this.expect(this.s.look(0, 2), 'N{', `to begin named unicode escape sequence`, true)

		let name = ''
		while (
			this.s.item &&
			this.s.item !== '}' &&
			!CHARS.VERTICAL_WHITESPACE.includes(this.s.item)
		) {
			name += this.s.item
			this.s.consume()
		}
		name = name.trim().toUpperCase()

		if (name.length === 0) {
			throw new JsonParserError(`Expected name in named unicode escape sequence`, this.s)
		}

		this.expect(this.s.item, '}', `to end named unicode escape sequence`, true)

		return `\\N{${name}}`
	}

	// Validates and returns a string representation of the escape sequence.
	// The renderer, such as Minecraft, will handle the actual escape sequence resolution.
	private parseUnicodeEscapeSequence(): string {
		this.expect(this.s.item, ['x', 'u', 'U'], `to begin escape sequence`)
		const char = this.s.item!
		const expectedHexLength = this.s.item === 'x' ? 2 : this.s.item === 'u' ? 4 : 8
		this.s.consume() // u, x, or U
		const hex = this.collectHexDigits(expectedHexLength)
		return `\\${char}${hex}`
	}

	private parseEscapeSequence(): string {
		this.expect(this.s.item, '\\', `to begin escape sequence`, true)

		const item = this.s.item
		if (
			item === '\\' ||
			item === "'" ||
			item === '"' ||
			item === 'n' ||
			item === 's' ||
			item === 't' ||
			item === 'b' ||
			item === 'f' ||
			item === 'r'
		) {
			this.s.consume()
			return '\\' + item
		} else if (item === 'u' || item === 'U' || item === 'x') {
			return this.parseUnicodeEscapeSequence()
		} else if (item === 'N') {
			return this.parseNamedUnicodeEscapeSequence()
		} else {
			throw new JsonParserError(`Unknown escape sequence '\\${item!}'`, this.s)
		}
	}

	private parseQuotedString(): string {
		this.expect(this.s.item, CHARS.STRING_QUOTE, 'to begin string')
		const quote = this.s.item
		this.s.consume() // Opening quote
		let str = ''
		while (this.s.item) {
			if (this.s.item === '\\') {
				str += this.parseEscapeSequence()
				continue
			} else if (this.s.item === quote) {
				break
			} else if (CHARS.VERTICAL_WHITESPACE.includes(this.s.item)) {
				throw new JsonParserError(`Expected ${quote} to close string`, this.s)
			}
			str += this.s.item
			this.s.consume()
		}
		if (!this.s.item) {
			throw new JsonParserError('Unexpected EOF in string', this.s)
		}
		this.s.consume() // Closing quote
		return str
	}

	private parseUnquotedString(): string {
		let str = ''
		if (!this.s.item || !CHARS.UNQUOTED_STRING_START.includes(this.s.item)) {
			throw new JsonParserError(
				`Expected [a-zA-Z0-9_] to start unquoted string. Found '${this.s.item!}' instead`,
				this.s
			)
		}
		while (this.s.item && CHARS.UNQUOTED_STRING.includes(this.s.item)) {
			str += this.s.item
			this.s.consume()
		}
		return str
	}

	private parseString(): string
	private parseString<T>(validStringOptions: T[]): T
	private parseString(validStringOptions?: string[]): string {
		let str: string
		const { line, column } = this.s
		if (this.s.item && CHARS.STRING_QUOTE.includes(this.s.item)) {
			str = this.parseQuotedString()
		} else {
			str = this.parseUnquotedString()
		}
		if (validStringOptions && !validStringOptions.includes(str)) {
			throw new JsonParserError(
				`Expected one of ${validStringOptions.join(', ')}`,
				this.s,
				undefined,
				line,
				column
			)
		}
		return str
	}

	private parseBoolean(): boolean {
		if (this.s.item && CHARS.STRING_QUOTE.includes(this.s.item)) {
			const value = this.parseQuotedString()
			if (value.toLowerCase() === 'true') {
				return true
			} else if (value.toLowerCase() === 'false') {
				return false
			}
			throw new JsonParserError(`Expected boolean, found '${value}'`, this.s)
		}
		if (this.s.look(0, 4).toLowerCase() === 'true') {
			this.s.consumeN(4)
			return true
		} else if (this.s.look(0, 5).toLowerCase() === 'false') {
			this.s.consumeN(5)
			return false
		}
		throw new JsonParserError(`Expected boolean`, this.s)
	}

	private parseFloat(): number {
		let num = ''
		let hasDecimal = false

		while (this.s.item) {
			if (this.s.item === '.') {
				if (hasDecimal) {
					throw new JsonParserError('Unexpected second decimal point in number', this.s)
				}
				hasDecimal = true
			}
			num += this.s.item
			this.s.consume()
		}

		this.expectSyntaxBoundaryAfter('number')
		return parseFloat(num)
	}

	private parseInt(): number {
		let num = ''
		if (this.s.item === '-') {
			num += '-'
			this.s.consume()
		}
		this.expect(this.s.item, CHARS.NUMBER, 'to begin number')

		while (this.s.item && CHARS.NUMBER.includes(this.s.item)) {
			num += this.s.item
			this.s.consume()
		}

		this.expectSyntaxBoundaryAfter('number')
		return parseInt(num)
	}

	private expect(
		thing: string | undefined,
		toBe: string | string[],
		message: string,
		consume = false
	): void {
		// prettier-ignore
		if (
			Array.isArray(toBe)
				? !thing || !toBe.includes(thing)
				: thing !== toBe
		) {
			if (Array.isArray(toBe)) {
				throw new JsonParserError(
					`Expected one of '${toBe.join("', '")}' ${message}. Found '${thing}' instead.`,
					this.s
				)
			}
			throw new JsonParserError(
				`Expected '${toBe}' ${message}. Found '${thing}' instead.`,
				this.s
			)
		}
		if (consume) {
			if (Array.isArray(toBe)) {
				this.s.consume()
			} else {
				this.s.consumeN(toBe.length)
			}
		}
	}

	private expectSyntaxBoundaryAfter(message: string) {
		if (this.s.item && !CHARS.SYNTAX_BOUNDARY.includes(this.s.item)) {
			throw new JsonParserError(`Unexpected '${this.s.item}' after ${message}`, this.s)
		}
	}
}
