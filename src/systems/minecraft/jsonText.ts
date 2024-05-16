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
	tl?: string
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

class JsonTextParser {
	private s: StringStream
	private unquotedStringChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
	private numChars = '0123456789'
	private whitespaceChars = ' \t\n\r'

	constructor(private str: string) {
		this.s = new StringStream(str)
	}

	parse(): JsonText | undefined {
		let text: JsonTextComponent | undefined
		try {
			text = this.parseTextComponent(true)
		} catch (e: any) {
			throw this.createError(
				'Unexpected Error while parsing JsonText',
				this.s.line,
				this.s.column,
				e as Error
			)
		}
		if (text) {
			return new JsonText(text)
		}
	}

	createError(message: string, line: number, column: number, child?: Error) {
		if (child) {
			return new Error(`${message} at ${line}:${column}\n\t\t${child.message}`)
		}
		const surrounding = this.s.string.slice(Math.max(0, this.s.index - 10), this.s.index + 10)
		return new Error(`${message} at ${line}:${column} -> ${surrounding}`)
	}

	consumeWhitespace() {
		this.s.consumeWhile(s => !!s.item && this.whitespaceChars.includes(s.item))
	}

	parseTextComponent(single = false): JsonTextComponent {
		const { line, column } = this.s
		let result: JsonTextComponent
		this.consumeWhitespace()
		if (this.s.item === '{') {
			result = this.parseObject()
		} else if (this.s.item === '[') {
			result = this.parseArray()
		} else if (this.s.item === '"') {
			result = this.parseString()
		} else {
			throw this.createError(
				`Unexpected token '${this.s.item as string}' while parsing JsonTextComponent`,
				line,
				column
			)
		}
		this.consumeWhitespace()
		if (single && this.s.item) {
			console.log('result', result)
			throw this.createError(
				`Unexpected token '${this.s.item as string}' while parsing JsonTextComponent`,
				this.s.line,
				this.s.column
			)
		}
		return result
	}

	parseValue(): JsonTextComponent | boolean | string | number {
		const { line, column } = this.s
		this.consumeWhitespace()
		if (this.s.item === '{') {
			return this.parseObject()
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
			throw this.createError(`Unexpected token ${this.s.item as string}`, line, column)
		}
	}

	parseObject(): JsonTextObject {
		const { line, column } = this.s
		try {
			this.s.consume() // {
			this.consumeWhitespace()
			const obj: JsonTextObject = {}
			while (this.s.item !== '}') {
				const key = this.parseString()
				this.consumeWhitespace()
				this.s.consume() // :
				this.consumeWhitespace()
				const value = this.parseValue()
				// @ts-ignore
				obj[key] = value
				this.consumeWhitespace()
				if (this.s.item === ',') {
					this.s.consume()
					this.consumeWhitespace()
				} else if (this.s.item === '}') {
					break
				} else {
					throw this.createError(
						`Unexpected token '${this.s.item as string}' while parsing JsonTextObject`,
						line,
						column
					)
				}
			}
			this.s.consume() // }
			return obj
		} catch (e: any) {
			throw this.createError(
				'Unexpected Error while parsing JsonTextObject',
				line,
				column,
				e as Error
			)
		}
	}

	parseArray(): JsonTextArray {
		this.s.consume() // [
		const arr: JsonTextArray = []
		while (this.s.item !== ']') {
			this.consumeWhitespace()
			const value = this.parseTextComponent()
			arr.push(value)
			if (this.s.item === ',') {
				this.s.consume()
				this.consumeWhitespace()
			}
		}
		this.s.consume() // ]
		return arr
	}

	parseString(): string {
		this.s.consume() // "
		let str = ''
		while (this.s.item) {
			if (this.s.item === '\\') {
				if (this.s.look(1) === 'n') {
					str += '\n'
					this.s.consume() // \
					this.s.consume() // n
					continue
				} else {
					str += this.s.item
					this.s.consume() // \
					str += this.s.item
					this.s.consume() // Escaped character
					continue
				}
			}
			if (this.s.item === '"') {
				break
			}
			str += this.s.item
			this.s.consume()
		}
		if (!this.s.item) {
			throw new Error('Unexpected EOF while parsing string')
		}
		this.s.consume() // "
		return str
	}

	parseBoolean(): boolean {
		if (this.s.look(0, 4) === 'true') {
			this.s.consumeN(4)
			return true
		} else if (this.s.look(0, 5) === 'false') {
			this.s.consumeN(5)
			return false
		}
		throw new Error(`Unexpected token while parsing boolean`)
	}

	parseNumber(): number {
		let num = ''
		let hasDecimal = false
		while (this.s.item) {
			if (this.s.item === '.') {
				if (hasDecimal) {
					throw new Error('Unexpected second decimal point in number')
				}
				hasDecimal = true
			}
			num += this.s.item
			this.s.consume()
		}
		return parseInt(num)
	}
}
