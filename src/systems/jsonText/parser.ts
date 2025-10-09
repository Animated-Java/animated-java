import { StringStream } from 'generic-stream'
import {
	COLOR_VALUES,
	CONTENT_KEYS,
	CONTENT_TYPES,
	JsonText,
	MODERN_CLICK_EVENT_SUBKEYS,
	TextObjectShadowColor,
	type LegacyClickEvent,
	type LegacyHoverEvent,
	type ModernClickEvent,
	type ModernHoverEvent,
	type TextElement,
	type TextObject,
	type TextObjectColor,
} from '.'
import type { MergeUnion } from '../../util/utilityTypes'

enum NUMBER_TYPES {
	ANY = 'number',
	BYTE = 'byte',
	SHORT = 'short',
	INTEGER = 'int',
	LONG = 'long',
	FLOAT = 'float',
	DOUBLE = 'double',
	HEXADECIMAL = 'hexadecimal',
	BINARY = 'binary number',
}

enum FEATURES {
	/**
	 * Allow unquoted object keys.
	 */
	LITERAL_KEYS = 1 << 0,

	/**
	 * Allow unquoted strings.
	 */
	LITERAL_STRINGS = 1 << 1,

	/**
	 * Allow using single quotes for object keys and strings.
	 */
	SINGLE_QUOTES = 1 << 2,

	/**
	 * Allow trailing commas in objects and arrays.
	 */
	TRAILING_COMMAS = 1 << 3,

	/**
	 * Allow omitting commas in objects and arrays.
	 *
	 * @NOTE This is not supported by Minecraft. Any JSON text components using this feature must be processed by this parser before using them in-game.
	 */
	OPTIONAL_COMMAS = 1 << 4,

	/**
	 * Use modern event format for text component mouse events.
	 * - `clickEvent` -> `click_event`
	 * - `hoverEvent` -> `hover_event`
	 *
	 * Requires [Minecraft 1.21.5](https://minecraft.wiki/w/Java_Edition_1.21.5) or above.

	 * See [this](https://minecraft.wiki/w/Java_Edition_1.21.5#Command_format:~:text=Text%20component%20format) article for more information.
	 */
	MODERN_EVENT_FORMAT = 1 << 5,

	/**
	 * Enables the `show_dialog` action for `click_event`.
	 *
	 * Requires {@link MODERN_EVENT_FORMAT} to be enabled
	 *
	 * Requires [Minecraft 1.21.6](https://minecraft.wiki/w/Java_Edition_1.21.6) or above.
	 */
	CLICK_EVENT_ACTION_SHOW_DIALOG = 1 << 6,

	/**
	 * Enables use of `type: "object"` in text objects.
	 *
	 * Requires [Minecraft 1.21.9](https://minecraft.wiki/w/Java_Edition_1.21.9) or above.
	 *
	 * See [this](https://minecraft.wiki/w/Java_Edition_1.21.9#Command_format:~:text=Text%20component%20format) article for more information.
	 */
	TEXT_OBJECT_TYPE_OBJECT = 1 << 7,

	/**
	 * Enables the `shadow_color` field in text objects.
	 *
	 * Requires [Minecraft 1.21.4](https://minecraft.wiki/w/Java_Edition_1.21.4) or above.
	 *
	 * See [this](https://minecraft.wiki/w/Java_Edition_1.21.4#Command_format:~:text=Raw%20JSON%20text%20format) article for more information.
	 */
	SHADOW_COLOR = 1 << 8,

	/**
	 * Enables the `shadow_color` field to accept {@link TextObjectColor} values, in addition to the normal number and array formats.
	 *
	 * Requires {@link SHADOW_COLOR} to be enabled
	 *
	 * @NOTE This is not supported by Minecraft. Any JSON text components using this feature must be processed by this parser before using them in-game.
	 */
	SHADOW_COLOR_ACCEPTS_STRING = 1 << 9,

	/**
	 * Enables `\s` as an escape sequence for space characters in strings.
	 *
	 * E.g. `"Hello,\sWorld!"` -> `"Hello, World!"`
	 *
	 * Requires [Minecraft 1.21.5](https://minecraft.wiki/w/Java_Edition_1.21.5#Command_format:~:text=network%20format%20directly.-,SNBT%20format) or above.
	 */
	SPACE_ESCAPE_SEQUENCE = 1 << 10,

	/**
	 * Enables `\x` as an escape sequence for hexadecimal characters in strings.
	 *
	 * E.g. `"\x41"` -> `"A"`
	 *
	 * Requires [Minecraft 1.21.5](https://minecraft.wiki/w/Java_Edition_1.21.5#Command_format:~:text=network%20format%20directly.-,SNBT%20format) or above.
	 */
	HEX_ESCAPE_SEQUENCE = 1 << 11,

	/**
	 * Enables `\U` as an escape sequence for 8-digit unicode characters in strings.
	 *
	 * E.g. `"\U0001F600"` -> `"😀"`
	 *
	 * Requires [Minecraft 1.21.5](https://minecraft.wiki/w/Java_Edition_1.21.5#Command_format:~:text=network%20format%20directly.-,SNBT%20format) or above.
	 */
	EIGHT_DIGIT_UNICODE_ESCAPE_SEQUENCE = 1 << 12,

	/**
	 * Enables `\N{...}` as an escape sequence for named unicode characters in strings.
	 *
	 * E.g. `"\N{Snowman}"` -> `"☃"`
	 *
	 * Requires [Minecraft 1.21.5](https://minecraft.wiki/w/Java_Edition_1.21.5#Command_format:~:text=network%20format%20directly.-,SNBT%20format) or above.
	 */
	NAMED_UNICODE_ESCAPE_SEQUENCE = 1 << 13,

	/**
	 * Allows text objects to infer `text` as an empty string if no other {@link CONTENT_KEYS} are present.
	 *
	 * E.g. `{ color: green }` -> `{ text: '', color: green }`
	 */
	IMPLICIT_TEXT_KEY = 1 << 14,

	/**
	 * Allows text objects to infer keys from keyless values.
	 *
	 * Inferrable keys:
	 * - `text`
	 * 	- `{ 'Hello, World!', color: red }` -> `{ text: 'Hello, World!', color: red }`
	 * 	- `{ 'Hello, World!' }` -> `{ text: 'Hello, World!' }`
	 * - `translate` (if `with` or `fallback` is present)
	 * 	- `{ my.translation.key, with: [...] }` -> `{ translate: my.translation.key, with: [...] }`
	 * 	- `{ my.translation.key, fallback: 'Hello, World!' }` -> `{ translate: my.translation.key, fallback: 'Hello, World!' }`
	 * - `color` (if `text` or `translate` is present)
	 * 	- `{ text: 'Hello, World!', red }` -> `{ text: 'Hello, World!', color: red }`
	 * 	- `{ text: '', '#00aced' }` -> `{ text: '', color: '#00aced' }`
	 */
	TEXT_OBJECT_INFERRED_KEYS = 1 << 15,
}

function compareVersions(a: string, b: string): number {
	const aParts = a.split('.').map(Number)
	const bParts = b.split('.').map(Number)
	for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
		const aPart = aParts[i] ?? 0
		const bPart = bParts[i] ?? 0
		if (aPart > bPart) return 1
		if (aPart < bPart) return -1
	}
	return 0
}

export class JsonTextParserError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'JsonTextParserError'
	}
}

interface JsonTextSyntaxErrorOptions {
	child?: Error
	line?: number
	column?: number
	pointerLength?: number
}

export class JsonTextSyntaxError extends Error {
	private originalMessage: string

	stream: StringStream
	child?: Error
	line: number
	column: number
	pointerLength: number

	constructor(
		message: string,
		stream: StringStream,
		{
			child,
			line = stream.line,
			column = stream.column,
			pointerLength = 1,
		}: JsonTextSyntaxErrorOptions = {}
	) {
		super(message)
		this.name = 'JsonTextSyntaxError'
		this.stream = stream
		this.child = child
		this.line = line
		this.column = column
		this.pointerLength = pointerLength

		this.originalMessage = message

		if (this.child) {
			this.message = `${this.message} at ${this.line}:${this.column}\n${this.child.message}`
			return
		}

		this.updatePointerMessage()
	}

	getOriginErrorMessage(): string {
		if (this.child) {
			if (this.child instanceof JsonTextSyntaxError) {
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
		this.message = `${this.originalMessage} at ${this.line}:${this.column}\n${lineString}\n${pointer}`
	}
}

export namespace CHARS {
	export const ALPHA_LOWER = Array.from('abcdefghijklmnopqrstuvwxyz')
	export const ALPHA_UPPER = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
	export const ALPHA = ALPHA_LOWER.concat(ALPHA_UPPER)
	export const NUMBER = Array.from('0123456789')
	export const INT_START = Array.from('-123456789')
	export const NUMBER_START = NUMBER.concat(Array.from('-.'))
	export const ALPHANUMERIC = ALPHA.concat(NUMBER)
	export const VERTICAL_WHITESPACE = Array.from('\n\r')
	export const WHITESPACE = Array.from(' \t').concat(VERTICAL_WHITESPACE)
	export const LITERAL = ALPHANUMERIC.concat(Array.from('._-+'))
	export const LITERAL_START = ALPHA.concat('_')
	export const QUOTES = Array.from(`"'`)
	export const BINARY = Array.from('01')
	export const HEXADECIMAL = NUMBER.concat(Array.from('abcdef'), Array.from('ABCDEF'))
	export const SYNTAX_BOUNDARY = WHITESPACE.concat(QUOTES, Array.from(',:[]{}'))
}

interface SourcePosition {
	index: number
	line: number
	column: number
	equals(other: { line: number; column: number }): boolean
}

/**
 * A multi-version JSON text parser.
 */
export class JsonTextParser {
	static maxNestingDepth = 512
	static maxArrayLength = 2 ** 31 - 9

	static defaultFeatures =
		// Minecraft syntax sugar
		FEATURES.LITERAL_KEYS |
		FEATURES.LITERAL_STRINGS |
		FEATURES.SINGLE_QUOTES |
		FEATURES.TRAILING_COMMAS |
		// Custom syntax sugar
		FEATURES.OPTIONAL_COMMAS |
		FEATURES.SHADOW_COLOR_ACCEPTS_STRING |
		FEATURES.TEXT_OBJECT_INFERRED_KEYS |
		FEATURES.IMPLICIT_TEXT_KEY

	private s!: StringStream
	private currentNestingDepth = 0

	minecraftVersion: string
	enabledFeatures = 0

	/**
	 * If {@link featureFlags} is not provided, features will be automatically enabled based on {@link minecraftVersion}.
	 *
	 * Individual features can be enabled/disabled post-construction by modifying {@link enabledFeatures}.
	 *
	 * By default, the following features are always enabled:
	 * - {@link FEATURES.LITERAL_KEYS}
	 * - {@link FEATURES.LITERAL_STRINGS}
	 * - {@link FEATURES.SINGLE_QUOTES}
	 * - {@link FEATURES.TRAILING_COMMAS}
	 * - {@link FEATURES.OPTIONAL_COMMAS}
	 * - {@link FEATURES.SHADOW_COLOR_ACCEPTS_STRING}
	 * - {@link FEATURES.TEXT_OBJECT_INFERRED_KEYS}
	 * - {@link FEATURES.IMPLICIT_TEXT_KEY}
	 * See {@link FEATURES} for information on each feature.
	 *
	 * @example Disable *only* literal strings and enable modern event format:
	 * ```ts
	 * const parser = new JsonTextParser('{ text: Hello }')
	 * parser.enabledFeatures &= ~FEATURES.LITERAL_STRINGS
	 * parser.enabledFeatures |= FEATURES.MODERN_EVENT_FORMAT
	 * ```
	 *
	 */
	constructor(options?: { minecraftVersion?: string; featureFlags?: number }) {
		const { minecraftVersion = JsonText.defaultMinecraftVersion, featureFlags } = options ?? {}

		this.minecraftVersion = minecraftVersion
		this.reset()

		if (typeof featureFlags === 'number') {
			this.enabledFeatures = featureFlags
		} else {
			this.enabledFeatures |= JsonTextParser.defaultFeatures

			if (compareVersions(this.minecraftVersion, '1.21.4') >= 0) {
				this.enabledFeatures |= FEATURES.SHADOW_COLOR
			}
			if (compareVersions(this.minecraftVersion, '1.21.5') >= 0) {
				this.enabledFeatures |=
					FEATURES.MODERN_EVENT_FORMAT |
					FEATURES.SPACE_ESCAPE_SEQUENCE |
					FEATURES.HEX_ESCAPE_SEQUENCE |
					FEATURES.EIGHT_DIGIT_UNICODE_ESCAPE_SEQUENCE |
					FEATURES.NAMED_UNICODE_ESCAPE_SEQUENCE
			}
			if (compareVersions(this.minecraftVersion, '1.21.6') >= 0) {
				this.enabledFeatures |= FEATURES.CLICK_EVENT_ACTION_SHOW_DIALOG
			}
			if (compareVersions(this.minecraftVersion, '1.21.9') >= 0) {
				this.enabledFeatures |= FEATURES.TEXT_OBJECT_TYPE_OBJECT
			}
		}
	}

	parse(text: string): JsonText {
		this.s = new StringStream(text)
		this.reset()

		try {
			this.consumeWhitespace()
			const result = this.parseTextElement()
			this.consumeWhitespace()
			if (this.s.item) {
				this.throwSyntax(`Unexpected trailing '${this.s.item}' after JsonTextElement`)
			}
			return new JsonText(result)
		} catch (e: any) {
			if (e instanceof JsonTextParserError) {
				throw new JsonTextParserError(
					`Internal Parser Error:\n\t${e.message}\nThis is a bug, please report it.`
				)
			}
			throw e
		}
	}

	throwSyntax(message: string, options?: JsonTextSyntaxErrorOptions): never {
		throw new JsonTextSyntaxError(message, this.s, options)
	}

	private recordPosition(): SourcePosition {
		return {
			index: this.s.index,
			line: this.s.line,
			column: this.s.column,
			equals(other: { line: number; column: number }): boolean {
				return this.line === other.line && this.column === other.column
			},
		}
	}

	private reset() {
		this.currentNestingDepth = 0
	}

	private consumeWhitespace() {
		this.s.consumeWhile(s => !!s.item && CHARS.WHITESPACE.includes(s.item))
	}

	private parseTextElement(): TextElement {
		let result: TextElement
		if (this.s.item === '{') {
			result = this.parseTextObject()
		} else if (this.s.item === '[') {
			result = this.parseTextElementArray()
		} else if (
			!this.s.item ||
			CHARS.QUOTES.includes(this.s.item) ||
			CHARS.LITERAL_START.includes(this.s.item)
		) {
			result = this.parseString()
		} else {
			this.throwSyntax(`Unexpected '${this.s.item}' in JsonTextElement`)
		}

		return result
	}

	private parseObject<T extends object, K extends keyof T & string = keyof T & string>({
		objectName,
		// Defaults to an empty set to avoid having to check for undefined later
		keys = new Set(),
		required,
		parseKey,
		parseValue,
		validateResult,
	}: {
		/** Name of the object being parsed, for error messages. */
		objectName: string
		/** Keys that are allowed in the object. */
		keys?: Set<K>
		/** Keys that are required in the object. */
		required?: Set<K>
		/**
		 * Called to parse a field's key. If not provided, keys will be parsed as strings.
		 *
		 * @returns The parsed key, or `undefined` to indicate the default key parser should be used.
		 *
		 * Can be used to parse keyless values.
		 */
		parseKey?: (keys: Set<K>, obj: Partial<T>) => { key: K; value?: T[K] & string } | undefined
		/**
		 * Called to parse a field's value, and set it on the object.
		 *
		 * Will never be called for fields not in {@link expectedFields}.
		 */
		parseValue: (key: K, obj: Partial<T>) => void
		/**
		 * Called with the completed object for extra validation.
		 *
		 * Returns a string to indicate an error, or undefined if the object is valid.
		 */
		validateResult?: (obj: Partial<T>) => string | void
	}): T {
		this.currentNestingDepth++
		if (this.currentNestingDepth > JsonTextParser.maxNestingDepth) {
			this.throwSyntax('Nesting depth limit exceeded')
		}

		const startPosition = this.recordPosition()

		try {
			this.expect(this.s.item, '{', 'to begin ' + objectName, true)
			this.consumeWhitespace()
			const obj = {} as Partial<T>
			while (this.s.item !== '}') {
				const keyPosition = this.recordPosition()
				const quoted = CHARS.QUOTES.includes(this.s.item!)
				if (quoted) keyPosition.column++

				let key: K | undefined
				const result = parseKey?.(keys, obj)
				if (result) {
					key = result.key
				} else {
					// Default key handling
					if (this.enabledFeatures & FEATURES.LITERAL_KEYS) {
						key = this.parseString() as K
					} else {
						key = this.parseQuotedString() as K
					}
				}
				if (result?.value !== undefined) {
					obj[key] = result.value
					this.consumeWhitespace()
					// If a colon is found after a keyless value, it was actually an unknown key
					if (this.s.item === ':') {
						this.throwSyntax(`Unknown key '${result.value}' in ${objectName}`, {
							...keyPosition,
							pointerLength: result.value.length,
						})
					}
				} else {
					if (obj[key] !== undefined) {
						this.throwSyntax(`Duplicate key '${key}'`, {
							...keyPosition,
							pointerLength: key.length,
						})
					}

					if (keys.size > 0 && !keys.has(key)) {
						this.throwSyntax(`Unknown key '${key}' in ${objectName}`, {
							...keyPosition,
							pointerLength: key.length,
						})
					}

					this.expectSyntaxBoundaryAfter(`key '${key}'`)
					this.consumeWhitespace()

					this.expect(this.s.item, ':', `to follow key '${key}'`, true)
					this.consumeWhitespace()

					if (!this.s.item) {
						this.throwSyntax(`Unexpected EOF in ` + objectName, this.s)
					}
					const valuePosition = this.recordPosition()
					parseValue(key, obj)
					// If the value parser didn't consume anything, assume the value is missing.
					if (valuePosition.equals(this.s)) {
						this.throwSyntax(`Missing value for '${key}'`, this.s)
					}
				}
				this.consumeWhitespace()

				if (this.s.item === ',') {
					this.s.consume()
					this.consumeWhitespace()
					if (this.s.item === ',') {
						this.throwSyntax(`Extra comma`, this.s)
					}
					if (this.s.item === '}' && !(this.enabledFeatures & FEATURES.TRAILING_COMMAS)) {
						this.throwSyntax(`Trailing comma in ` + objectName, this.s)
					}
				} else if (this.s.item === '}') {
					break
				} else if (this.s.item === undefined) {
					this.throwSyntax('Unexpected EOF in ' + objectName, this.s)
				} else if (!(this.enabledFeatures & FEATURES.OPTIONAL_COMMAS)) {
					this.throwSyntax(`Expected ',' or '}' after ${objectName} entry`)
				}
			}
			this.s.consume() // }

			if (required) {
				for (const key of required) {
					if (obj[key] !== undefined) continue
					this.throwSyntax(
						`Missing required field '${String(key)}' in ` + objectName,
						startPosition
					)
				}
			}

			if (validateResult) {
				const error = validateResult(obj)
				if (error) {
					this.throwSyntax(error, startPosition)
				}
			}

			this.currentNestingDepth--
			return obj as T
		} catch (e: any) {
			this.throwSyntax('Invalid ' + objectName, { child: e, ...startPosition })
		}
	}

	private normalizeHexColor(color: string): string {
		if (color.startsWith('0x')) color = '#' + color.substring(2)
		if (!/^#[0-9a-fA-F]{6}$/i.test(color)) {
			this.throwSyntax(`Invalid hex color '${color}'`, this.s)
		}
		return color.toLowerCase()
	}

	private normalizeHex8Color(color: string): string {
		if (color.startsWith('0x')) color = '#' + color.substring(2)
		if (!/^#[0-9a-fA-F]{8}$/i.test(color)) {
			this.throwSyntax(`Invalid hex color '${color}'`, this.s)
		}
		return color.toLowerCase()
	}

	private assertTextObjectColorIsValid(color: string): asserts color is TextObjectColor {
		if (color.startsWith('#')) {
			this.normalizeHexColor(color)
		} else if (!(color in COLOR_VALUES)) {
			this.throwSyntax(`Unknown color '${color}'`, this.s)
		}
	}

	private parseTextObjectColor(): TextObjectColor {
		const color = this.parseString()
		if (color.startsWith('#')) {
			this.normalizeHexColor(color)
			return color as `#${string}`
		} else if (color in COLOR_VALUES) {
			return color as keyof typeof COLOR_VALUES
		} else {
			this.throwSyntax(`Unknown color '${color}'`, this.s)
		}
	}

	private parseTextObjectShadowColor(): TextObjectShadowColor {
		if (!(this.enabledFeatures & FEATURES.SHADOW_COLOR)) {
			this.throwSyntax(`'shadow_color' field is only available in Minecraft 1.21.4 and above`)
		}

		if (this.s.item === '[') {
			const rgba = this.parseFloatArray(4) as [number, number, number, number]
			for (const n of rgba) {
				if (typeof n !== 'number' || n < 0 || n > 1) {
					this.throwSyntax(`'shadow_color' array values must be numbers between 0 and 1`)
				}
			}
			return rgba
		} else if (CHARS.NUMBER.includes(this.s.item!)) {
			const colorString = this.parseNumber(NUMBER_TYPES.INTEGER)
			let color: number
			if (colorString.startsWith('0x')) {
				color = parseInt(colorString.substring(2), 16)
			} else {
				color = parseInt(colorString, 10)
			}
			if (typeof color !== 'number' || color < 0 || color > 0xffffffff) {
				this.throwSyntax(`'shadow_color' value must be a number between 0 and 0xffffffff`)
			}
			return JsonText.intToRgba(color)
		}

		if (!(this.enabledFeatures & FEATURES.SHADOW_COLOR_ACCEPTS_STRING)) {
			this.throwSyntax(`Expected value of 'shadow_color' to be a float-array or integer.`)
		}

		let hexColor = this.parseString()
		if (hexColor.startsWith('#')) {
			hexColor = this.normalizeHex8Color(hexColor)
		} else if (hexColor in COLOR_VALUES) {
			hexColor = COLOR_VALUES[hexColor as keyof typeof COLOR_VALUES]
		} else {
			this.throwSyntax(`Unknown color '${hexColor}'`, this.s)
		}
		return JsonText.hexToRgba(hexColor)
	}

	private parseTextObject() {
		return this.parseObject<TextObject>({
			objectName: 'TextObject',
			keys: new Set([
				'type',
				'font',
				'color',
				'bold',
				'italic',
				'underlined',
				'strikethrough',
				'obfuscated',
				'extra',
				'insertion',
				'clickEvent',
				'hoverEvent',
				'shadow_color',
				'click_event',
				'hover_event',
				'text',
				'translate',
				'fallback',
				'with',
				'score',
				'selector',
				'separator',
				'keybind',
				'nbt',
				'block',
				'entity',
				'storage',
				'interpret',
				'object',
				'sprite',
				'atlas',
				'player',
			]),
			parseKey: (keys, obj) => {
				if (this.enabledFeatures & FEATURES.TEXT_OBJECT_INFERRED_KEYS) {
					if (this.s.item === '#') {
						if (obj.color !== undefined) {
							this.throwSyntax(
								`Cannot infer keyless value as 'color' when 'color' is already defined`,
								this.s
							)
						}
						const colorString = this.parseHashedHexColor()
						return { key: 'color', value: colorString }
					} else if (this.s.look(0, 2) === '0x') {
						if (obj.color !== undefined) {
							this.throwSyntax(
								`Cannot infer keyless value as 'color' when 'color' is already defined`,
								this.s
							)
						}
						// Parse as hex color
						const colorString = this.parseNumber(NUMBER_TYPES.HEXADECIMAL)
						return { key: 'color', value: this.normalizeHexColor(colorString) }
					}
				}

				let key: keyof TextObject | undefined
				if (this.enabledFeatures & FEATURES.LITERAL_KEYS) {
					key = this.parseString() as keyof TextObject
				} else {
					key = this.parseQuotedString() as keyof TextObject
				}
				// Let the main parser handle known and duplicate keys
				if (keys.has(key) || obj[key] != undefined) return { key }

				if (this.enabledFeatures & FEATURES.TEXT_OBJECT_INFERRED_KEYS) {
					// Unknown key, try to infer
					if (
						obj.color === undefined &&
						(obj.text !== undefined || obj.translate !== undefined)
					) {
						this.assertTextObjectColorIsValid(key)
						return { key: 'color', value: key }
					} else if (
						obj.translate === undefined &&
						(obj.fallback !== undefined || obj.with !== undefined)
					) {
						return { key: 'translate', value: key }
					} else if (obj.text === undefined) {
						return { key: 'text', value: key }
					}
				}

				return { key } // Let the main parser handle unknown keys
			},
			parseValue: (key, obj) => {
				switch (key) {
					case 'sprite':
					case 'atlas':
						if (!(this.enabledFeatures & FEATURES.TEXT_OBJECT_TYPE_OBJECT)) {
							this.throwSyntax(
								`'${key}' field is only available in Minecraft 1.21.9 and above`
							)
						}
					case 'insertion':
					case 'font':
					case 'keybind':
					case 'selector':
					case 'nbt':
					case 'block':
					case 'entity':
					case 'storage':
					case 'text':
					case 'translate':
					case 'fallback':
						obj[key] = this.parseString()
						break

					case 'bold':
					case 'italic':
					case 'obfuscated':
					case 'strikethrough':
					case 'underlined':
					case 'interpret':
						obj[key] = this.parseBoolean()
						break

					case 'source':
						obj[key] = this.parseString(['storage', 'block', 'entity'])
						break

					case 'separator':
						obj[key] = this.parseTextElement()
						break

					case 'object':
						if (!(this.enabledFeatures & FEATURES.TEXT_OBJECT_TYPE_OBJECT)) {
							this.throwSyntax(
								`'object' field is only available in Minecraft 1.21.9 and above`
							)
						}
						obj[key] = this.parseString(['atlas', 'player'])
						break

					case 'player':
						if (!(this.enabledFeatures & FEATURES.TEXT_OBJECT_TYPE_OBJECT)) {
							this.throwSyntax(
								`'player' field is only available in Minecraft 1.21.9 and above`
							)
						}
						obj[key] = this.parsePlayerObject()
						break

					case 'type': {
						const type = this.parseString(Object.values(CONTENT_TYPES))
						if (
							type === CONTENT_TYPES.OBJECT &&
							!(this.enabledFeatures & FEATURES.TEXT_OBJECT_TYPE_OBJECT)
						) {
							this.throwSyntax(
								`Object type '${CONTENT_TYPES.OBJECT}' is only available in Minecraft 1.21.9 and above`
							)
						}
						obj[key] = type
						break
					}

					case 'color':
						obj[key] = this.parseTextObjectColor()
						break

					case 'shadow_color':
						obj[key] = this.parseTextObjectShadowColor()
						break

					case 'with':
					case 'extra':
						obj[key] = this.parseTextElementArray()
						break

					case 'score':
						obj[key] = this.parseScoreObject()
						break

					case 'clickEvent': {
						const event = this.parseLegacyClickEventObject()
						if (this.enabledFeatures & FEATURES.MODERN_EVENT_FORMAT) {
							if (obj.click_event !== undefined) {
								this.throwSyntax(
									`Cannot use both 'clickEvent' and 'click_event' fields. For Minecraft versions below 1.21.5, use only 'clickEvent'`
								)
							}
							obj.click_event = this.transformLegacyClickEventToModern(event)
							delete obj.clickEvent
							break
						}
						obj[key] = event
						break
					}

					case 'click_event': {
						const event = this.parseModernClickEventObject()
						if (!(this.enabledFeatures & FEATURES.MODERN_EVENT_FORMAT)) {
							if (obj.clickEvent !== undefined) {
								this.throwSyntax(
									`Cannot use both 'clickEvent' and 'click_event' fields. For Minecraft versions 1.21.5 and above, use only 'click_event'`
								)
							}
							obj.clickEvent = this.transformModernClickEventObjectToLegacy(event)
							delete obj.click_event
							break
						}
						obj[key] = event
						break
					}

					case 'hoverEvent': {
						const event = this.parseLegacyHoverEventObject()
						if (this.enabledFeatures & FEATURES.MODERN_EVENT_FORMAT) {
							if (obj.hover_event !== undefined) {
								this.throwSyntax(
									`Cannot use both 'hoverEvent' and 'hover_event' fields. For Minecraft versions below 1.21.5, use only 'hoverEvent'`
								)
							}
							obj.hover_event = this.transformLegacyHoverEventObjectToModern(event)
							delete obj.hoverEvent
							break
						}
						obj[key] = event
						break
					}

					case 'hover_event':
						const event = this.parseModernHoverEventObject()
						if (!(this.enabledFeatures & FEATURES.MODERN_EVENT_FORMAT)) {
							if (obj.hoverEvent !== undefined) {
								this.throwSyntax(
									`Cannot use both 'hoverEvent' and 'hover_event' fields. For Minecraft versions 1.21.5 and above, use only 'hover_event'`
								)
							}
							obj.hoverEvent = this.transformModernHoverEventObjectToLegacy(event)
							delete obj.hover_event
							break
						}
						obj[key] = event
						break
				}
			},
			validateResult: obj => {
				if (this.enabledFeatures & FEATURES.TEXT_OBJECT_INFERRED_KEYS) {
					if (
						obj.text !== undefined &&
						obj.translate === undefined &&
						(obj.with !== undefined || obj.fallback !== undefined)
					) {
						obj.translate = obj.text
						delete obj.text
					}
				}

				const contentKeys = Object.values(CONTENT_KEYS).filter(k => obj[k] !== undefined)
				if (contentKeys.length > 1) {
					return `Only one content field may be present, but found ${
						contentKeys.length
					}: '${contentKeys.join("', '")}'`
				}

				if (Object.values(CONTENT_KEYS).every(k => obj[k] == undefined)) {
					if (this.enabledFeatures & FEATURES.IMPLICIT_TEXT_KEY) {
						obj.text ??= ''
					} else {
						return `At least one content field must be present: ${Object.values(
							CONTENT_KEYS
						).join(', ')}`
					}
				}

				switch (obj.type) {
					case CONTENT_TYPES.TEXT:
						if (obj.text == undefined) {
							return `'text' is required when 'type' is '${CONTENT_TYPES.TEXT}'`
						}
						break

					case CONTENT_TYPES.TRANSLATABLE:
						if (obj.translate == undefined) {
							return `'translate' is required when 'type' is '${CONTENT_TYPES.TRANSLATABLE}'`
						}
						break

					case CONTENT_TYPES.SCORE:
						if (obj.score == undefined) {
							return `'score' is required when 'type' is '${CONTENT_TYPES.SCORE}'`
						}
						break

					case CONTENT_TYPES.SELECTOR:
						if (obj.selector == undefined) {
							return `'selector' is required when 'type' is '${CONTENT_TYPES.SELECTOR}'`
						}
						break

					case CONTENT_TYPES.KEYBIND:
						if (obj.keybind == undefined) {
							return `'keybind' is required when 'type' is '${CONTENT_TYPES.KEYBIND}'`
						}
						break

					case CONTENT_TYPES.NBT:
						if (obj.nbt == undefined) {
							return `'nbt' is required when 'type' is '${CONTENT_TYPES.NBT}'`
						}
						break

					case CONTENT_TYPES.OBJECT:
						if (obj.sprite == undefined) {
							return `'sprite' is required when 'type' is '${CONTENT_TYPES.OBJECT}'`
						}
						break
				}

				if (obj.translate == undefined && obj.with != undefined)
					return `'with' requires 'translate'`
				else if (obj.translate == undefined && obj.fallback != undefined)
					return `'fallback' requires 'translate'`

				if (obj.separator != undefined && obj.nbt == undefined && obj.selector == undefined)
					return `'separator' requires 'nbt' or 'selector'`

				if (obj.object != undefined) {
					if (obj.object === 'player' && obj.player == undefined)
						return `player object requires 'player'`
					else if (obj.object === 'atlas' && obj.sprite == undefined)
						return `atlas object requires 'sprite'`
					else if (obj.player == undefined && obj.sprite == undefined)
						return `'object' requires 'player' or 'sprite'`
				}

				if (obj.atlas != undefined && obj.sprite == undefined) {
					return `'atlas' requires 'sprite'`
				}

				if (obj.nbt == undefined) {
					if (obj.source != undefined) return `'source' requires 'nbt'`
					else if (obj.block != undefined) return `'block' requires 'nbt'`
					else if (obj.entity != undefined) return `'entity' requires 'nbt'`
					else if (obj.storage != undefined) return `'storage' requires 'nbt'`
				}

				if (obj.nbt != undefined) {
					if (
						obj.block == undefined &&
						obj.entity == undefined &&
						obj.storage == undefined
					)
						return `'nbt' requires 'block', 'entity', or 'storage'`

					switch (obj.source) {
						case 'block':
							if (obj.block == undefined)
								return `'nbt' with source of 'block' requires 'block'`
							break

						case 'entity':
							if (obj.entity == undefined)
								return `'nbt' with source of 'entity' requires 'entity'`
							break

						case 'storage':
							if (obj.storage == undefined)
								return `'nbt' with source of 'storage' requires 'storage'`
							break
					}
				}
			},
		})
	}

	private parsePlayerPropertyObject() {
		return this.parseObject<
			NonNullable<NonNullable<TextObject['player']>['properties']>[number]
		>({
			objectName: 'player property object',
			keys: new Set(['name', 'value', 'signature']),
			required: new Set(['name', 'value']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'name':
					case 'value':
					case 'signature':
						obj[key] = this.parseString()
						break
				}
			},
		})
	}

	private parsePlayerPropertiesArray() {
		return this.parseArray<NonNullable<NonNullable<TextObject['player']>['properties']>>({
			arrayName: 'player properties array',
			parseItem: this.parsePlayerPropertyObject.bind(this),
		})
	}

	private parsePlayerObject() {
		return this.parseObject<NonNullable<TextObject['player']>>({
			objectName: 'player object',
			keys: new Set(['name', 'id', 'texture', 'cape', 'model', 'properties', 'hat']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'id':
						if (this.s.item === '[') {
							obj[key] = this.parseIntArray<[number, number, number, number]>(
								false,
								4
							)
							break
						}
					// fallthrough
					case 'name':
					case 'texture':
					case 'cape':
						obj[key] = this.parseString()
						break

					case 'hat':
						obj[key] = this.parseBoolean()
						break

					case 'model':
						obj[key] = this.parseString(['wide', 'slim'])
						break

					case 'properties':
						obj[key] = this.parsePlayerPropertiesArray()
						break
				}
			},
		})
	}

	private parseUnknownArray(arrayName: string) {
		return this.parseArray<unknown[]>({
			arrayName,
			parseItem: this.parseUnknownValue.bind(this),
		})
	}

	private parseUnknownValue() {
		if (this.s.item === '{') {
			return this.parseUnknownObject('object')
		} else if (this.s.item === '[') {
			return this.parseUnknownArray('array')
		} else if (!this.s.item) {
			this.throwSyntax('Unexpected EOF', this.s)
		} else if (CHARS.QUOTES.includes(this.s.item)) {
			return this.parseQuotedString()
		} else if (this.s.item === 't' || this.s.item === 'f') {
			return this.parseBoolean()
		} else if (CHARS.NUMBER_START.includes(this.s.item)) {
			return this.parseNumber()
		} else if (CHARS.LITERAL_START.includes(this.s.item)) {
			return this.parseLiteral()
		} else {
			this.throwSyntax(`Unexpected '${this.s.item}'`, this.s)
		}
	}

	private parseUnknownObject(objectName: string) {
		return this.parseObject<Record<string, unknown>>({
			objectName,
			parseValue: (key, obj) => {
				obj[key] = this.parseUnknownValue()
			},
		})
	}

	private parseScoreObject() {
		return this.parseObject<NonNullable<TextObject['score']>>({
			objectName: 'score object',
			keys: new Set(['name', 'objective']),
			required: new Set(['name', 'objective']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'name':
					case 'objective':
						obj[key] = this.parseString()
						break
				}
			},
		})
	}

	private parseLegacyClickEventObject() {
		return this.parseObject<LegacyClickEvent>({
			objectName: 'clickEvent',
			keys: new Set(['action', 'value']),
			required: new Set(['action', 'value']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'action':
						const value = this.parseString([
							'open_url',
							'open_file',
							'run_command',
							'suggest_command',
							'change_page',
							'copy_to_clipboard',
						] as const)
						if (value === 'open_file') {
							this.throwSyntax(`clickEvent 'open_file' cannot be used by commands`)
						}
						obj[key] = value
						break

					case 'value':
						obj[key] = this.parseString()
						break
				}
			},
		})
	}

	private parseModernClickEventObject() {
		return this.parseObject<MergeUnion<ModernClickEvent>>({
			objectName: 'click_event',
			keys: new Set([
				'action',
				'url',
				'path',
				'command',
				'page',
				'value',
				'dialog',
				'id',
				'payload',
			]),
			required: new Set(['action']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'action':
						const value = this.parseString([
							'open_url',
							'open_file',
							'run_command',
							'suggest_command',
							'change_page',
							'copy_to_clipboard',
							'show_dialog',
							'custom',
						] as const)
						if (value === 'open_file') {
							this.throwSyntax(`Click event 'open_file' cannot be used by commands`)
						}
						if (value === 'show_dialog') {
							if (!(this.enabledFeatures & FEATURES.CLICK_EVENT_ACTION_SHOW_DIALOG)) {
								this.throwSyntax(
									`Click event 'show_dialog' is only available in Minecraft 1.21.6 and above`
								)
							}
						}
						obj[key] = value
						break

					case 'url':
						const url: string = this.parseString()
						let parsedUrl: URL
						try {
							parsedUrl = new URL(url)
						} catch (e: any) {
							this.throwSyntax(
								`Invalid URL format for 'url' in 'open_url' clickEvent: ${e.message}`
							)
						}

						if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
							this.throwSyntax(`Invalid URL: Protocol must be 'http:' or 'https:'`)
						}
						obj[key] = url
						break

					case 'path':
						obj[key] = this.parseString()
						break

					case 'command':
						obj[key] = this.parseString()
						break

					case 'page':
						obj[key] = parseInt(this.parseNumber(NUMBER_TYPES.INTEGER))
						break

					case 'value':
						obj[key] = this.parseString()
						break

					case 'dialog':
						obj[key] = this.parseUnknownObject('click_event.dialog')
						break

					case 'id':
						obj[key] = this.parseString()
						break

					case 'payload':
						obj[key] = this.parseUnknownValue()
						break
				}
			},
			validateResult: obj => {
				let subkeys = Object.values(MODERN_CLICK_EVENT_SUBKEYS)
				switch (obj.action) {
					case 'open_url':
						if (obj.url === undefined) {
							return `Click event of type 'open_url' missing required key 'url'`
						}
						subkeys = subkeys.filter(k => k !== 'url')
						break

					case 'open_file':
						if (obj.path === undefined) {
							return `Click event of type 'open_file' missing required key 'path'`
						}
						subkeys = subkeys.filter(k => k !== 'path')
						break

					case 'run_command':
						if (obj.command === undefined) {
							return `Click event of type 'run_command' missing required key 'command'`
						}
						subkeys = subkeys.filter(k => k !== 'command')
						break

					case 'suggest_command':
						if (obj.command === undefined) {
							return `Click event of type 'suggest_command' missing required key 'command'`
						}
						subkeys = subkeys.filter(k => k !== 'command')
						break

					case 'change_page':
						if (obj.page === undefined) {
							return `Click event of type 'change_page' missing required key 'page'`
						}
						subkeys = subkeys.filter(k => k !== 'page')
						break

					case 'copy_to_clipboard':
						if (obj.value === undefined) {
							return `Click event of type 'copy_to_clipboard' missing required key 'value'`
						}
						subkeys = subkeys.filter(k => k !== 'value')
						break

					case 'custom':
						if (obj.id === undefined) {
							return `Click event of type 'custom' missing required key 'id'`
						}
						subkeys = subkeys.filter(k => k !== 'id')
						subkeys = subkeys.filter(k => k !== 'payload')
						break

					case 'show_dialog':
						if (obj.dialog === undefined) {
							return `Click event of type 'show_dialog' missing required key 'dialog'`
						}
						subkeys = subkeys.filter(k => k !== 'dialog')
						break
				}

				if (subkeys.some(k => obj[k] !== undefined)) {
					return `Click event of type '${obj.action}' cannot have keys: ${subkeys
						.map(k => `'${k}'`)
						.join(', ')}`
				}
			},
		}) as ModernClickEvent
	}

	private transformModernClickEventObjectToLegacy(event: ModernClickEvent): LegacyClickEvent {
		switch (event.action) {
			case 'open_url':
				return {
					action: 'open_url',
					value: event.url,
				}

			case 'open_file':
				this.throwSyntax(`Click event 'open_file' cannot be used by commands`)

			case 'run_command':
			case 'suggest_command':
				return {
					action: event.action,
					value: event.command,
				}

			case 'change_page':
				return {
					action: 'change_page',
					value: String(event.page),
				}

			case 'copy_to_clipboard':
				return {
					action: 'copy_to_clipboard',
					value: event.value,
				}

			case 'show_dialog':
				this.throwSyntax(
					`Click events of type 'show_dialog' are not supported in versions below 1.21.6`
				)

			case 'custom':
				this.throwSyntax(
					`Click events of type 'custom' are not supported in versions below 1.21.5`
				)
		}
	}

	private transformLegacyClickEventToModern(event: LegacyClickEvent): ModernClickEvent {
		switch (event.action) {
			case 'open_url': {
				let url: string
				try {
					url = new URL(event.value).toString()
				} catch {
					this.throwSyntax(`Invalid URL format for 'open_url' clickEvent`)
				}
				if (!/^https?:\/\//.exec(event.value)) {
					this.throwSyntax(
						`Invalid URL format for 'open_url' clickEvent. URL must start with 'http://' or 'https://'`
					)
				}
				return {
					action: 'open_url',
					url: url,
				}
			}

			case 'open_file':
				this.throwSyntax(`Click event 'open_file' cannot be used by commands`)

			case 'run_command':
			case 'suggest_command':
				return {
					action: event.action,
					command: event.value,
				}

			case 'change_page':
				return {
					action: 'change_page',
					page: Number(event.value),
				}

			case 'copy_to_clipboard':
				return {
					action: 'copy_to_clipboard',
					value: event.value,
				}
		}
	}

	private parseLegacyHoverEventObjectShowItemContents() {
		return this.parseObject<
			Exclude<(LegacyHoverEvent & { action: 'show_item' })['contents'], string>
		>({
			objectName: 'hoverEvent.contents',
			keys: new Set(['id', 'count', 'tag']),
			required: new Set(['id']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'id':
						obj[key] = this.parseString()
						break

					case 'count':
						obj[key] = parseInt(this.parseNumber(NUMBER_TYPES.BYTE))
						break

					case 'tag':
						obj[key] = this.parseUnknownValue()
						break
				}
			},
		})
	}

	private parseLegacyHoverEventObjectShowEntityContents() {
		return this.parseObject<(LegacyHoverEvent & { action: 'show_entity' })['contents']>({
			objectName: 'hoverEvent.contents',
			keys: new Set(['type', 'id', 'name']),
			required: new Set(['type', 'id']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'id':
						if (this.s.item === '[') {
							obj[key] = this.parseIntArray<[number, number, number, number]>(
								false,
								4
							)
							break
						}
					// ID should fallthrough to string parsing if not an int array
					case 'type':
					case 'name':
						obj[key] = this.parseString()
						break
				}
			},
		})
	}

	private parseLegacyHoverEventObject() {
		return this.parseObject<LegacyHoverEvent>({
			objectName: 'hoverEvent',
			keys: new Set(['action', 'contents']),
			required: new Set(['action', 'contents']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'action':
						obj[key] = this.parseString(['show_text', 'show_item', 'show_entity'])
						break
					case 'contents':
						switch (obj.action) {
							case undefined: {
								this.throwSyntax(
									`'action' must be defined before 'contents' in hoverEvent`
								)
							}

							case 'show_text': {
								obj[key] = this.parseTextElement()
								break
							}

							case 'show_item': {
								if (this.s.item === '{') {
									obj[key] = this.parseLegacyHoverEventObjectShowItemContents()
									break
								}
								obj[key] = this.parseString()
								break
							}

							case 'show_entity': {
								obj[key] = this.parseLegacyHoverEventObjectShowEntityContents()
								break
							}
						}
						break
				}
			},
		})
	}

	private parseModernHoverEventObject() {
		return this.parseObject<MergeUnion<ModernHoverEvent>>({
			objectName: 'hover_event',
			keys: new Set(['action', 'value', 'id', 'count', 'components', 'name', 'uuid']),
			required: new Set(['action']),
			parseValue: (key, obj) => {
				switch (key) {
					case 'action':
						obj[key] = this.parseString(['show_text', 'show_item', 'show_entity'])
						break

					case 'uuid':
						if (this.s.item === '[') {
							obj[key] = this.parseIntArray<[number, number, number, number]>(
								false,
								4
							)
							break
						}
					// UUID should fallthrough to string parsing if not an int array
					case 'id':
					case 'name':
						obj[key] = this.parseString()
						break

					case 'value':
						obj[key] = this.parseTextElement()
						break

					case 'count':
						obj[key] = parseInt(this.parseNumber(NUMBER_TYPES.BYTE))
						break

					case 'components':
						obj[key] = this.parseUnknownValue()
						break
				}
			},
			validateResult: obj => {
				if (obj.action === undefined) {
					return `Hover event must include 'action' field`
				}

				switch (obj.action) {
					case 'show_text':
						if (obj.value === undefined) {
							return `Hover event 'show_text' missing required field 'value'`
						}
						break

					case 'show_item':
						if (obj.id === undefined) {
							return `Hover event 'show_item' missing required field 'id'`
						}
						break

					case 'show_entity':
						if (obj.id === undefined) {
							return `Hover event 'show_entity' missing required field 'id'`
						}
						if (obj.uuid === undefined) {
							return `Hover event 'show_entity' missing required field 'uuid'`
						}
						break
				}

				switch (true) {
					case obj.value !== undefined && obj.action !== 'show_text':
						return `'value' is only valid when hover_event action is 'show_text'`

					case obj.count !== undefined && obj.action !== 'show_item':
						return `'count' is only valid when hover_event action is 'show_item'`

					case obj.id !== undefined &&
						obj.action !== 'show_item' &&
						obj.action !== 'show_entity':
						return `'id' is only valid when hover_event action is 'show_item' or 'show_entity'`

					case obj.components !== undefined && obj.action !== 'show_item':
						return `'components' is only valid when hover_event action is 'show_item'`

					case obj.name !== undefined && obj.action !== 'show_entity':
						return `'name' is only valid when hover_event action is 'show_entity'`

					case obj.uuid !== undefined && obj.action !== 'show_entity':
						return `'uuid' is only valid when hover_event action is 'show_entity'`
				}
			},
		}) as ModernHoverEvent
	}

	private transformLegacyHoverEventObjectToModern(event: LegacyHoverEvent): ModernHoverEvent {
		switch (event.action) {
			case 'show_text':
				return {
					action: 'show_text',
					value: event.contents,
				}

			case 'show_item':
				if (typeof event.contents === 'string') {
					return {
						action: 'show_item',
						id: event.contents,
					}
				}
				if (event.contents.tag !== undefined) {
					this.throwSyntax(
						`Cannot transform 'hoverEvent' with 'tag' into modern 'hover_event'.` +
							` Please use 'hover_event' for Minecraft versions 1.21.5 and above`
					)
				}
				return {
					action: 'show_item',
					id: event.contents.id,
					count: event.contents.count,
				}

			case 'show_entity':
				return {
					action: 'show_entity',
					id: event.contents.type,
					uuid: event.contents.id,
					name: event.contents.name,
				}
		}
	}

	private transformModernHoverEventObjectToLegacy(event: ModernHoverEvent): LegacyHoverEvent {
		switch (event.action) {
			case 'show_text':
				return {
					action: 'show_text',
					contents: event.value,
				}

			case 'show_item':
				if (event.components !== undefined) {
					this.throwSyntax(
						`Cannot transform 'hover_event' with 'components' into legacy 'hoverEvent'.` +
							` Please use 'hoverEvent' for Minecraft versions below 1.21.5`
					)
				}
				return {
					action: 'show_item',
					contents: {
						id: event.id,
						count: event.count,
					},
				}

			case 'show_entity':
				if (Array.isArray(event.uuid)) {
					this.throwSyntax(
						`Cannot transform 'hover_event' with 'uuid' as int-array into legacy 'hoverEvent'.` +
							` Please either use a string UUID, or use 'hoverEvent' for Minecraft versions below 1.21.5`
					)
				}
				return {
					action: 'show_entity',
					contents: {
						type: event.id,
						id: event.uuid,
						name: event.name,
					},
				}
		}
	}

	private parseArray<T extends any[]>({
		arrayName,
		parsePrefix,
		parseItem,
		expectedLength,
	}: {
		arrayName: string
		/**
		 * Optional function to parse the array prefix (e.g., type identifier).
		 */
		parsePrefix?: () => void
		parseItem: () => T[number]
		expectedLength?: number
	}): T {
		this.currentNestingDepth++
		if (this.currentNestingDepth > JsonTextParser.maxNestingDepth) {
			this.throwSyntax('Nesting depth limit exceeded', this.s)
		}

		this.expect(this.s.item, '[', 'to begin ' + arrayName, true)
		this.consumeWhitespace()

		if (parsePrefix) {
			parsePrefix()
			this.consumeWhitespace()
		}

		const array = [] as unknown as T
		while (this.s.item !== ']') {
			this.consumeWhitespace()
			const itemPosition = this.recordPosition()
			const value = parseItem()
			if (itemPosition.equals(this.s)) {
				throw new JsonTextParserError(
					`parseItem function for ${arrayName} did not consume any input`
				)
			}
			array.push(value)
			if (array.length > JsonTextParser.maxArrayLength) {
				this.throwSyntax('Array length limit exceeded', this.s)
			}
			this.expectSyntaxBoundaryAfter('array item')
			this.consumeWhitespace()

			if (expectedLength !== undefined && array.length > expectedLength) {
				this.throwSyntax(
					`Too many items in ` + arrayName + ` (expected ${expectedLength})`,
					itemPosition
				)
			}

			if (this.s.item === ',') {
				this.s.consume()
				this.consumeWhitespace()
				if (this.s.item === ',') {
					this.throwSyntax(`Extra comma`, this.s)
				}
				if (this.s.item === ']' && !(this.enabledFeatures & FEATURES.TRAILING_COMMAS)) {
					this.throwSyntax(`Trailing comma in ` + arrayName, this.s)
				}
			} else if (this.s.item === ']') {
				break
			} else if (this.s.item === undefined) {
				this.throwSyntax('Unexpected EOF in ' + arrayName, this.s)
			} else if (!(this.enabledFeatures & FEATURES.OPTIONAL_COMMAS)) {
				this.throwSyntax(`Expected ',' or ']' after ${arrayName} item`, this.s)
			}
		}

		if (expectedLength !== undefined && array.length < expectedLength) {
			this.throwSyntax(
				`Not enough items in ` +
					arrayName +
					` (expected ${expectedLength}, got ${array.length})`
			)
		}

		this.s.consume() // ]
		return array
	}

	private parseTextElementArray(): TextElement[] {
		return this.parseArray({
			arrayName: 'TextElementArray',
			parseItem: this.parseTextElement.bind(this),
		})
	}

	private parseIntArray<T extends number[]>(requireTypeIdentifier?: boolean, length?: number): T {
		return this.parseArray<T>({
			arrayName: 'int-array',
			parsePrefix: () => {
				if (this.s.item === 'I') {
					this.s.consume()
					this.consumeWhitespace()
					this.expect(this.s.item, ';', 'to follow array type identifier', true)
				} else if (requireTypeIdentifier) {
					this.throwSyntax(`Expected explicit int-array`, this.s)
				}
			},
			parseItem: () => parseInt(this.parseNumber(NUMBER_TYPES.INTEGER)),
			expectedLength: length,
		})
	}

	private parseFloatArray<T extends number[]>(length?: number): T {
		return this.parseArray<T>({
			arrayName: 'float-array',
			parseItem: () => parseFloat(this.parseNumber(NUMBER_TYPES.FLOAT)),
			expectedLength: length!,
		})
	}

	private collectHexDigits(count: number): string {
		let hex = ''
		for (let i = 0; i < count; i++) {
			if (this.s.item && CHARS.HEXADECIMAL.includes(this.s.item)) {
				hex += this.s.item
				this.s.consume()
			} else {
				this.throwSyntax(
					`Unexpected '${this.s.item!}' in ${count}-digit hex escape sequence`
				)
			}
		}
		return hex
	}

	private parseHashedHexColor(): string {
		this.expect(this.s.item, '#', `to begin hex color`, true)

		const digits = this.parseDigits('hex', CHARS.HEXADECIMAL)

		return this.normalizeHexColor('#' + digits)
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
			this.throwSyntax(`Expected name in named unicode escape sequence`, this.s)
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
			item === 'b' ||
			item === 'r' ||
			item === 't' ||
			item === 'f'
		) {
			this.s.consume()
			return '\\' + item
		} else if (item === 's') {
			if (!(this.enabledFeatures & FEATURES.SPACE_ESCAPE_SEQUENCE)) {
				this.throwSyntax(
					`Minecraft ${this.minecraftVersion} does not support space escape sequences ('\\s')`
				)
			}

			this.s.consume()
			return '\\s'
		} else if (item === 'u') {
			return this.parseUnicodeEscapeSequence()
		} else if (item === 'x') {
			if (!(this.enabledFeatures & FEATURES.HEX_ESCAPE_SEQUENCE)) {
				this.throwSyntax(
					`Minecraft ${this.minecraftVersion} does not support hex unicode escape sequences ('\\x00')`
				)
			}

			return this.parseUnicodeEscapeSequence()
		} else if (item === 'U') {
			if (!(this.enabledFeatures & FEATURES.EIGHT_DIGIT_UNICODE_ESCAPE_SEQUENCE)) {
				this.throwSyntax(
					`Minecraft ${this.minecraftVersion} does not support 8-digit unicode escape sequences ('\\U00000000')`
				)
			}

			return this.parseUnicodeEscapeSequence()
		} else if (item === 'N') {
			if (!(this.enabledFeatures & FEATURES.NAMED_UNICODE_ESCAPE_SEQUENCE)) {
				this.throwSyntax(
					`Minecraft ${this.minecraftVersion} does not support named unicode escape sequences ('\\${item}{Name}')`
				)
			}

			return this.parseNamedUnicodeEscapeSequence()
		} else {
			this.throwSyntax(`Unknown escape sequence '\\${item!}'`, this.s)
		}
	}

	private parseQuotedString(): string {
		const quote = this.s.item!
		this.expect(this.s.item, CHARS.QUOTES, 'to begin string', true)

		if (this.s.item === "'" && !(this.enabledFeatures & FEATURES.SINGLE_QUOTES)) {
			this.throwSyntax(
				`Single quotes are not supported in Minecraft ${this.minecraftVersion}`
			)
		}

		let str = ''
		while (this.s.item) {
			if (this.s.item === '\\') {
				str += this.parseEscapeSequence()
				continue
			} else if (this.s.item === quote) {
				break
			} else if (CHARS.VERTICAL_WHITESPACE.includes(this.s.item)) {
				this.throwSyntax(`Expected ${quote} to close string`, this.s)
			}
			str += this.s.item
			this.s.consume()
		}
		if (!this.s.item) {
			this.throwSyntax('Unexpected EOF in string', this.s)
		}
		this.expect(this.s.item, quote, `to close string`, true)
		return str
	}

	private parseLiteral(): string {
		if (!(this.enabledFeatures & FEATURES.LITERAL_STRINGS)) {
			this.throwSyntax(
				`Literal strings are not supported in Minecraft ${this.minecraftVersion}`
			)
		}
		if (!this.s.item || !CHARS.LITERAL_START.includes(this.s.item)) {
			this.throwSyntax(
				`Expected [a-zA-Z0-9_] to start literal string. Found '${this.s.item!}' instead`
			)
		}
		const str = this.s.collectWhile(s => !!s.item && CHARS.LITERAL.includes(s.item))
		if (str.length === 0) {
			throw new JsonTextParserError('Literal string parsing failed unexpectedly')
		}
		return str
	}

	private parseString(): string
	private parseString<T>(validStringOptions: T[]): T
	private parseString<T extends string>(validStringOptions?: T[]): T {
		let str: T
		const startPosition = this.recordPosition()

		if (this.s.item && CHARS.QUOTES.includes(this.s.item)) {
			str = this.parseQuotedString() as T
		} else {
			str = this.parseLiteral() as T
		}

		if (validStringOptions && !validStringOptions.includes(str)) {
			this.throwSyntax(`Expected one of ${validStringOptions.join(', ')}`, startPosition)
		}
		return str
	}

	private parseBoolean(): boolean {
		if (this.s.look(0, 4).toLowerCase() === 'true') {
			this.s.consumeN(4)
			return true
		} else if (this.s.look(0, 5).toLowerCase() === 'false') {
			this.s.consumeN(5)
			return false
		}
		this.throwSyntax(`Expected boolean`, this.s)
	}

	private parseDigits(
		name: string,
		digitChars = CHARS.NUMBER,
		minLength = 0,
		maxLength = Infinity
	): string {
		let digits = ''
		while (this.s.item && digitChars.includes(this.s.item)) {
			digits += this.s.item
			if (digits.length > maxLength) {
				this.throwSyntax(`Too many ${name} digits (max ${maxLength})`, this.s)
			}
			this.s.consume()

			const beforeWhitespace = this.recordPosition()
			const whitespace = CHARS.WHITESPACE.includes(this.s.item)
			this.consumeWhitespace()

			if (this.s.item === '_') {
				if (whitespace) {
					this.throwSyntax(`Underscore must be between ${name} digits`, this.s)
				}
				this.s.consumeWhile(s => s.item === '_')
				if (!(this.s.item && digitChars.includes(this.s.item))) {
					this.throwSyntax(`Underscore must be between ${name} digits`, this.s)
				}
			} else if (whitespace) {
				// REVIEW - We should avoid backing up the stream like this.
				this.s.index = beforeWhitespace.index - 1
				this.s.consume()
				break
			}
		}
		if (digits.length < minLength) {
			this.throwSyntax(`Not enough ${name} digits (min ${minLength})`, this.s)
		}
		return digits
	}

	private parseNumber(type = NUMBER_TYPES.ANY): string {
		let numberString = ''
		let hasDecimal = false
		let numberChars = CHARS.NUMBER

		const prefix = this.s.look(0, 2).toLowerCase()
		if (prefix === '0x') {
			this.s.consumeN(2)
			numberString += '0x'
			numberChars = CHARS.HEXADECIMAL
			type = NUMBER_TYPES.HEXADECIMAL
		} else if (prefix === '0b') {
			this.s.consumeN(2)
			numberString += '0b'
			numberChars = CHARS.BINARY
			type = NUMBER_TYPES.BINARY
		} else if (this.s.item === '-') {
			numberString += '-'
			this.s.consume()
			this.consumeWhitespace()
		}

		if (type === NUMBER_TYPES.HEXADECIMAL && prefix !== '0x') {
			this.throwSyntax(`Hexadecimal numbers must begin with '0x'`, this.s)
		} else if (type === NUMBER_TYPES.BINARY && prefix !== '0b') {
			this.throwSyntax(`Binary numbers must begin with '0b'`, this.s)
		}

		const expectFloat = type === NUMBER_TYPES.FLOAT || type === NUMBER_TYPES.DOUBLE

		if (this.s.item === '.') {
			if (!expectFloat) {
				this.throwSyntax(`Decimal points are not permitted in ${type}s`)
			}
			numberString += '.'
			hasDecimal = true
			this.s.consume()
			this.consumeWhitespace()
		}

		this.expect(this.s.item, numberChars, 'to begin ' + type)

		while (
			this.s.item &&
			(numberChars.includes(this.s.item) || this.s.item === '.' || this.s.item === '_')
		) {
			numberString += this.parseDigits(type, numberChars)
			this.consumeWhitespace()

			if (this.s.item === 'e' || this.s.item === 'E') {
				if (!expectFloat) {
					this.throwSyntax(`E notation is not allowed in ${type}s`, this.s)
				}

				this.s.consume() // e or E
				this.consumeWhitespace()

				const floatValue = parseFloat(numberString)
				if (isNaN(floatValue)) {
					this.throwSyntax(`Invalid ${type} before exponent`, this.s)
				}

				const exponent = parseInt(this.parseNumber(NUMBER_TYPES.INTEGER))
				if (isNaN(exponent)) {
					this.throwSyntax(`Invalid exponent`, this.s)
				}

				return floatValue.toString() + 'e' + exponent.toString()
			} else if ((this.s.item as string) === '.') {
				if (hasDecimal) {
					this.throwSyntax('Second decimal point in ' + type, this.s)
				}
				hasDecimal = true
				numberString += '.'
				this.s.consume()
				this.consumeWhitespace()
			}
		}

		this.expectSyntaxBoundaryAfter(type)

		let value: number
		switch (type) {
			case NUMBER_TYPES.BYTE:
			case NUMBER_TYPES.SHORT:
			case NUMBER_TYPES.INTEGER:
			case NUMBER_TYPES.LONG:
				value = parseInt(numberString)
				break

			case NUMBER_TYPES.HEXADECIMAL:
				value = parseInt(numberString.substring(2), 16)
				break

			case NUMBER_TYPES.BINARY:
				value = parseInt(numberString.substring(2), 2)
				break

			case NUMBER_TYPES.FLOAT:
			case NUMBER_TYPES.DOUBLE:
			case NUMBER_TYPES.ANY:
				value = parseFloat(numberString)
				break
		}

		if (isNaN(value)) {
			this.throwSyntax(`Invalid ` + type, this.s)
		}

		return numberString
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
				this.throwSyntax(
					`Expected one of '${toBe.join("', '")}' ${message}. Found '${thing}' instead`,
				)
			}
			this.throwSyntax(
				`Expected '${toBe}' ${message}. Found '${thing}' instead`,
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
			const previous = this.s.string.at(this.s.index - 1)
			if (previous && CHARS.SYNTAX_BOUNDARY.includes(previous)) return
			this.throwSyntax(`Unexpected '${this.s.item}' after ${message}`, this.s)
		}
	}
}

// type KeyConstraint<T extends object> =
// 	| keyof T
// 	| {
// 			/** The key that is expected to be present in the object. */
// 			key: keyof T
// 			/**
// 			 * If true, this field is always required.
// 			 */
// 			required?:
// 				| boolean
// 				| {
// 						/** Require this field if the {@link dependsOn} field is present in the object. */
// 						dependsOn: (keyof T)[]
// 				  }

// 			/** Keys that are expected to be present if this key is present. */
// 			expects?: (keyof T)[]
// 			/** At least one of these fields must be present if this key is present. */
// 			expectsOneOf?: (keyof T)[]
// 			/** Keys that are mutually exclusive with this key. */
// 			mutuallyExclusiveKeys?: (keyof T)[]
// 	  }

// interface TestParseObjectOptions<T extends object> {
// 	name: string
// 	/** Fields that are allowed in the object. */
// 	keys?: KeyConstraint<T>[]
// 	/** At least one of these fields must be present in the object. */
// 	requireOneOf?: (keyof T)[]
// 	/**
// 	 * Called to parse a field's value in the object.
// 	 *
// 	 * Will never be called for fields not in {@link expectedFields}.
// 	 */
// 	parseValue: (ctx: { key: keyof T; obj: Partial<T>; existingKeys: Set<keyof T> }) => void
// 	/**
// 	 * Called with the completed object for extra validation.
// 	 *
// 	 * Returns a string to indicate an error, or undefined if the object is valid.
// 	 */
// 	validateObject?: (obj: Partial<T>) => string | void
// }

// function test<T extends object>(options: TestParseObjectOptions<T>) {}
// test<Merge<CompositeComponent>>({
// 	name: 'test',
// 	keys: [
// 		'type',
// 		'text',
// 		'font',
// 		'color',
// 		'bold',
// 		'italic',
// 		'underlined',
// 		'obfuscated',
// 		'strikethrough',
// 		'shadow_color',
// 		'insertion',
// 		{
// 			key: 'extra',
// 			expectsOneOf: Object.values(CONTENT_KEYS),
// 		},
// 		{
// 			key: 'clickEvent',
// 			mutuallyExclusiveKeys: ['click_event'],
// 		},
// 		{
// 			key: 'hoverEvent',
// 			mutuallyExclusiveKeys: ['hover_event'],
// 		},
// 		{
// 			key: 'click_event',
// 			mutuallyExclusiveKeys: ['clickEvent'],
// 		},
// 		{
// 			key: 'hover_event',
// 			mutuallyExclusiveKeys: ['hoverEvent'],
// 		},
// 		{
// 			key: 'translate',
// 			required: { dependsOn: ['with'] },
// 			expects: ['with'],
// 		},
// 		{ key: 'with', expects: ['translate'] },
// 		{ key: 'fallback', expects: ['translate'] },
// 		'score',
// 		{
// 			key: 'selector',
// 			required: { dependsOn: ['separator'] },
// 		},
// 		{ key: 'separator', expects: ['selector'] },
// 		'keybind',
// 		{
// 			key: 'nbt',
// 			required: { dependsOn: ['block', 'entity', 'storage'] },
// 			expectsOneOf: ['block', 'entity', 'storage'],
// 		},
// 		{ key: 'block', expects: ['nbt'] },
// 		{ key: 'entity', expects: ['nbt'] },
// 		{ key: 'storage', expects: ['nbt'] },
// 		'sprite',
// 		{
// 			key: 'atlas',
// 			required: { dependsOn: ['sprite'] },
// 			expects: ['sprite'],
// 		},
// 	],
// 	parseValue: ({ key, obj }) => {},
// })
