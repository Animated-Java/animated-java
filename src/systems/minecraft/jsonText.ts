import { StringStream } from 'generic-stream'

export const FONT = '16px MinecraftFull'

export type JsonTextColor =
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

export type JsonTextObject = {
	text?: string
	font?: string
	color?: JsonTextColor
	extra?: JsonTextArray
	bold?: true | false
	italic?: true | false
	underlined?: true | false
	strikethrough?: true | false
	obfuscated?: true | false
	insertion?: string
	clickEvent?: {
		action:
			| 'open_url'
			| 'open_file'
			| 'run_command'
			| 'suggest_command'
			| 'change_page'
			| 'copy_to_clipboard'
		value: string
	}
	hoverEvent?: {
		action: 'show_text' | 'show_item' | 'show_entity'
		contents:
			| JsonTextComponent
			| {
					type: string
					id: string
					name?: string
			  }
			| {
					id: string
					count?: number
					tag?: string
			  }
	}
	translate?: string
	fallback?: string
	with?: JsonTextArray
	score?: {
		name: string
		objective: string
		value?: number
	}
	selector?: string
	separator?: string
	keybind?: string
	nbt?: string
	block?: string
	entity?: string
	storage?: string
}

export type JsonTextComponent = string | JsonTextArray | JsonTextObject | JsonText

export type JsonTextArray = JsonTextComponent[]

export class JsonText {
	public isJsonTextClass = true
	private text: JsonTextComponent

	constructor(jsonText: JsonTextComponent) {
		this.text = jsonText
	}

	toString() {
		return JSON.stringify(this.text)
	}

	toJSON() {
		return this.text
	}

	static fromString(str: string): JsonText | undefined {
		// return new JsonText(JSON.parse(str) as JsonTextComponent)
		const parser = new JsonTextParser(str)
		return parser.parse()
	}
}

class ParserError extends Error {
	line: number
	column: number
	constructor(
		message: string,
		private stream: StringStream,
		child?: Error,
		line?: number,
		column?: number
	) {
		super(message)

		this.line = line ?? stream.line
		this.column = column ?? stream.column

		if (child) {
			this.message = `${message} at ${this.line}:${this.column}\n${child.message}`
			return
		}
		this.setPointerMessage()
	}

	setPointerMessage() {
		// Unexpected '}' at 1:5
		// World!"}
		//        ^
		const pointer = ' '.repeat(this.column - 1) + '^'
		this.message = `${this.message} at ${this.line}:${this.column}\n${this.stream.lines[
			this.line - 1
		].content.trimEnd()}\n${pointer}`
	}
}

class JsonTextParser {
	private s: StringStream
	private numChars = '0123456789'
	private whitespaceChars = ' \t\n\r'

	constructor(private str: string) {
		this.s = new StringStream(str)
	}

	parse(): JsonText {
		let text: JsonTextComponent | undefined
		try {
			text = this.parseTextComponent(true)
		} catch (e) {
			throw new ParserError('Failed to parse JsonText', this.s, e as Error)
		}
		if (text) {
			return new JsonText(text)
		}
		return new JsonText('')
	}

	consumeWhitespace() {
		this.s.consumeWhile(s => !!s.item && this.whitespaceChars.includes(s.item))
	}

	parseTextComponent(single = false): JsonTextComponent {
		let result: JsonTextComponent
		this.consumeWhitespace()
		if (this.s.item === '{') {
			result = this.parseTextObject()
		} else if (this.s.item === '[') {
			result = this.parseArray()
		} else if (this.s.item === '"') {
			result = this.parseString()
		} else {
			throw new ParserError(
				`Unexpected '${this.s.item as string}' in JsonTextComponent`,
				this.s
			)
		}
		this.consumeWhitespace()
		if (single && this.s.item) {
			throw new ParserError(
				`Unexpected '${this.s.item as string}' in JsonTextComponent`,
				this.s
			)
		}
		return result
	}

	parseValue(): JsonTextComponent | boolean | string | number {
		const { line, column } = this.s
		this.consumeWhitespace()
		if (this.s.item === '{') {
			return this.parseTextObject()
		} else if (this.s.item === '[') {
			return this.parseArray()
		} else if (this.s.item === '"') {
			return this.parseString()
		} else if (this.s.item === 't' || this.s.item === 'f') {
			return this.parseBoolean()
		} else if (
			this.s.item === '-' ||
			this.s.item === '.' ||
			(this.s.item && this.numChars.includes(this.s.item))
		) {
			return this.parseNumber()
		} else {
			throw new ParserError(
				`Unexpected ${this.s.item as string}`,
				this.s,
				undefined,
				line,
				column
			)
		}
	}

	parseObject(valueParser: (key: string, obj: any) => void, validator?: (obj: any) => void): any {
		const { line, column } = this.s
		try {
			// TS attempts to incorrectly infer the type of this.item.s as '{' after this if statement.
			// Casting it to string here fixes the issue.
			if ((this.s.item as string) !== '{') {
				throw new ParserError(
					`Unexpected '${this.s.item as string}' in JsonTextObject`,
					this.s
				)
			}
			this.s.consume() // {
			this.consumeWhitespace()
			const obj: any = {}
			while (this.s.item !== '}') {
				const key = this.parseString()
				this.consumeWhitespace()
				this.s.consume() // :
				this.consumeWhitespace()
				valueParser(key, obj)
				this.consumeWhitespace()
				if (this.s.item === ',') {
					this.s.consume()
					this.consumeWhitespace()
				} else if (this.s.item === '}') {
					break
				} else if (this.s.item === undefined) {
					throw new ParserError('Unexpected EOF in JsonTextObject', this.s)
				} else {
					throw new ParserError(`Unexpected '${this.s.item}' in JsonTextObject`, this.s)
				}
			}
			this.s.consume() // }
			if (validator) validator(obj)
			return obj
		} catch (e: any) {
			throw new ParserError(
				'Failed to parse JsonTextObject',
				this.s,
				e as Error,
				line,
				column
			)
		}
	}

	parseTextObject() {
		return this.parseObject(
			(key, obj: JsonTextObject) => {
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
						const color = this.parseString() as JsonTextColor
						if (!(color.startsWith('#') || COLOR_MAP[color])) {
							throw new ParserError(`Unknown color '${color}'`, this.s)
						}
						obj.color = color
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
						obj[key] = this.parseArray()
						break
					case 'score':
						obj[key] = this.parseScoreObject()
						break
					case 'clickEvent':
						obj[key] = this.parseClickEventObject()
						break
					case 'hoverEvent':
						obj[key] = this.parseHoverEventObject()
						break
					default:
						throw new ParserError(`Unknown key '${key}' in JsonTextObject`, this.s)
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
					throw new ParserError(
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
					throw new ParserError(
						`JsonTextObject includes 'nbt' but does not include one of 'block', 'entity', or 'storage'.`,
						this.s
					)
				}
			}
		) as JsonTextObject
	}

	parseScoreObject() {
		return this.parseObject(
			(key, obj: NonNullable<JsonTextObject['score']>) => {
				switch (key) {
					case 'name':
					case 'objective':
						obj[key] = this.parseString()
						break
					case 'value':
						obj[key] = this.parseNumber()
						break
					default:
						throw new ParserError(
							`Unknown key '${key}' in JsonTextObject.score`,
							this.s
						)
				}
			},
			obj => {
				if (obj.name === undefined || obj.objective === undefined) {
					throw new ParserError(
						`JsonTextObject.score must include 'name' and 'objective'`,
						this.s
					)
				}
			}
		) as JsonTextObject['score']
	}

	parseClickEventObject() {
		return this.parseObject(
			(key, obj: NonNullable<JsonTextObject['clickEvent']>) => {
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
						throw new ParserError(
							`Unknown key '${key}' in JsonTextObject.clickEvent`,
							this.s
						)
				}
			},
			obj => {
				if (obj.action === undefined) {
					throw new ParserError(`JsonTextObject.clickEvent must include 'action'`, this.s)
				} else if (obj.value === undefined) {
					throw new ParserError(`JsonTextObject.clickEvent must include 'value'`, this.s)
				}
			}
		) as JsonTextObject['clickEvent']
	}

	parseHoverEventObject() {
		return this.parseObject(
			(key, obj: NonNullable<JsonTextObject['hoverEvent']>) => {
				switch (key) {
					case 'action':
						obj[key] = this.parseString(['show_text', 'show_item', 'show_entity'])
						break
					case 'contents':
						switch (obj.action) {
							case undefined: {
								throw new ParserError(
									`HoverEvent 'action' is required, and must be defined before 'contents'.`,
									this.s
								)
							}
							case 'show_text': {
								obj[key] = this.parseTextComponent()
								break
							}
							case 'show_item': {
								obj[key] = this.parseObject(
									(key, item) => {
										switch (key) {
											case 'id':
												item[key] = this.parseString()
												break
											case 'count':
												item[key] = this.parseNumber()
												break
											case 'tag':
												item[key] = this.parseString()
												break
											default:
												throw new ParserError(
													`Unknown key '${key}' in JsonTextObject.itemHoverEvent.contents`,
													this.s
												)
										}
									},
									obj => {
										if (obj.id === undefined) {
											throw new ParserError(
												`JsonTextObject.itemHoverEvent.contents must include 'id'`,
												this.s
											)
										}
									}
								)
								break
							}
							case 'show_entity': {
								obj[key] = this.parseObject(
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
												throw new ParserError(
													`Unknown key '${key}' in JsonTextObject.entityHoverEvent.contents`,
													this.s
												)
										}
									},
									obj => {
										if (obj.type === undefined) {
											throw new ParserError(
												`JsonTextObject.entityHoverEvent.contents must include 'type'`,
												this.s
											)
										}
									}
								)
								break
							}
						}
						break
					default:
						throw new ParserError(
							`Unknown key '${key}' in JsonTextObject.hoverEvent`,
							this.s
						)
				}
			},
			obj => {
				if (obj.action === undefined) {
					throw new ParserError(`JsonTextObject.hoverEvent must include 'action'`, this.s)
				} else if (obj.contents === undefined) {
					throw new ParserError(
						`JsonTextObject.hoverEvent must include 'contents'`,
						this.s
					)
				}
			}
		) as JsonTextObject['hoverEvent']
	}

	parseArray(): JsonTextArray {
		this.s.consume() // [
		this.consumeWhitespace()
		const arr: JsonTextArray = []
		while (this.s.item !== ']') {
			this.consumeWhitespace()
			const value = this.parseTextComponent()
			arr.push(value)
			if (this.s.item === ',') {
				this.s.consume()
				this.consumeWhitespace()
			} else if (this.s.item === ']') {
				break
			} else {
				throw new ParserError(
					`Unexpected '${this.s.item as string}' in JsonTextArray`,
					this.s
				)
			}
		}
		this.s.consume() // ]
		return arr
	}

	parseString(): string
	parseString<T>(allowedValues: T[]): T
	parseString(allowedValues?: string[]): string {
		if (this.s.item !== '"') {
			throw new ParserError(`Unexpected '${this.s.item as string}' in string`, this.s)
		}
		this.s.consume() // "
		let str = ''
		while (this.s.item) {
			if ((this.s.item as string) === '\\') {
				if (this.s.look(1) === 'n') {
					str += '\n'
					this.s.consume() // \
					this.s.consume() // n
					continue
				} else {
					this.s.consume() // \
					str += this.s.item
					this.s.consume() // Escaped character
					continue
				}
			}
			if (this.s.item === '"') {
				break
			} else if (this.s.item === '\n') {
				throw new ParserError('Unexpected newline in string', this.s)
			}
			str += this.s.item
			this.s.consume()
		}
		if (!this.s.item) {
			throw new ParserError('Unexpected EOF in string', this.s)
		}
		this.s.consume() // "
		if (allowedValues && !allowedValues.includes(str)) {
			throw new ParserError(
				`Unexpected string value '${str}'. Expected one of ${allowedValues.join(', ')}`,
				this.s
			)
		}
		return str
	}

	parseBoolean(): boolean {
		if (this.s.item === '"') {
			const value = this.parseString()
			if (value === 'true') {
				return true
			} else if (value === 'false') {
				return false
			}
			throw new ParserError(`Unexpected incomplete string boolean`, this.s)
		}
		if (this.s.look(0, 4) === 'true') {
			this.s.consumeN(4)
			return true
		} else if (this.s.look(0, 5) === 'false') {
			this.s.consumeN(5)
			return false
		}
		throw new ParserError(`Unexpected incomplete boolean`, this.s)
	}

	parseNumber(): number {
		let num = ''
		let hasDecimal = false
		while (this.s.item) {
			if (this.s.item === '.') {
				if (hasDecimal) {
					throw new ParserError('Unexpected second decimal point in number', this.s)
				}
				hasDecimal = true
			}
			num += this.s.item
			this.s.consume()
		}
		return parseInt(num)
	}
}
