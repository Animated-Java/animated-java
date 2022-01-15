function assert(condition: any, message?: string) {
	if (!condition) {
		throw new Error(message || 'Assertion failed')
	}
}
function every<T>(v: T[], arg1: (x: T) => boolean): any {
	assert(Array.isArray(v), 'expected an array')
	return !v.find((x) => !arg1(x))
}

export enum SNBTTagType {
	END = 0,
	BYTE = 1,
	SHORT = 2,
	INT = 3,
	LONG = 4,
	FLOAT = 5,
	DOUBLE = 6,
	BYTE_ARRAY = 7,
	STRING = 8,
	LIST = 9,
	COMPOUND = 10,
	INT_ARRAY = 11,
	LONG_ARRAY = 12,
	BOOLEAN = 13,
}
enum SNBTStringifyFlags {
	NONE = 0,
	EXCLUDE_TYPE = 1,
}
// this class is a generic for holding an NBT value,
// it supports merge, set, stringify, and clone

function typeToConstructor(type: SNBTTagType) {
	switch (type) {
		case SNBTTagType.BOOLEAN:
			return SNBT.Boolean
		case SNBTTagType.BYTE:
			return SNBT.Byte
		case SNBTTagType.BYTE_ARRAY:
			return SNBT.Byte_Array
		case SNBTTagType.COMPOUND:
			return SNBT.Compound
		case SNBTTagType.DOUBLE:
			return SNBT.Double
		case SNBTTagType.END:
			throw new Error(
				'SNBTTagType.END should never be used in a SNBT construct'
			)
		case SNBTTagType.FLOAT:
			return SNBT.Float
		case SNBTTagType.INT:
			return SNBT.Int
		case SNBTTagType.INT_ARRAY:
			return SNBT.Int_Array
		case SNBTTagType.LIST:
			return SNBT.List
		case SNBTTagType.LONG:
			return SNBT.Long
		case SNBTTagType.LONG_ARRAY:
			return SNBT.Long_Array
		case SNBTTagType.SHORT:
			return SNBT.Short
		case SNBTTagType.STRING:
			return SNBT.String
		default:
			throw `Unknown SNBTTagType ${type}`
	}
}

export class SNBTTag {
	assert(path: string, type: SNBTTagType) {
		const gotten = this.get(path)
		if (!gotten) {
			this.set(path, typeToConstructor(type)())
		} else if (!(type === gotten.type)) {
			throw Error(
				`NBT type at ${path} is not of type ${
					SNBTTagType[type]
				}. Instead found: ${SNBTTagType[gotten.type]}`
			)
		}
	}
	push(...values: SNBTTag[]) {
		for (const value of values) {
			switch (this.type) {
				case SNBTTagType.LIST:
					this.value.push(value)
					break
				case SNBTTagType.BYTE_ARRAY:
					assert(
						value.type === SNBTTagType.BYTE,
						`Expected BYTE to push to BYTE_ARRAY. Got ${
							SNBTTagType[value.type]
						}`
					)
					this.value.push(value)
					break
				case SNBTTagType.INT_ARRAY:
					assert(
						value.type === SNBTTagType.INT,
						`Expected INT to push to INT_ARRAY. Got ${
							SNBTTagType[value.type]
						}`
					)
					this.value.push(value)
					break
				case SNBTTagType.LONG_ARRAY:
					assert(
						value.type === SNBTTagType.LONG,
						`Expected LONG to push to LONG_ARRAY. Got ${
							SNBTTagType[value.type]
						}`
					)
					this.value.push(value)
					break
				default:
					throw `Unable to perform push on ${SNBTTagType[this.type]}`
			}
		}
	}
	_merge(b: SNBTTag) {
		// if merging is possible merge otherwise set
		if (
			(this.type === SNBTTagType.COMPOUND &&
				b.type === SNBTTagType.COMPOUND) ||
			(this.type === SNBTTagType.LIST && b.type === SNBTTagType.LIST) ||
			(this.type === SNBTTagType.INT_ARRAY &&
				b.type === SNBTTagType.INT_ARRAY) ||
			(this.type === SNBTTagType.LONG_ARRAY &&
				b.type === SNBTTagType.LONG_ARRAY) ||
			(this.type === SNBTTagType.BYTE_ARRAY &&
				b.type === SNBTTagType.BYTE_ARRAY)
		) {
			for (let [key, value] of Object.entries(
				b.value as Record<string, SNBTTag>
			)) {
				if (!(key in this.value)) {
					this.value[key] = value.clone()
				} else {
					this.value[key]._merge(value)
				}
			}
		} else {
			this.type = b.type
			this.value = b.value
		}
	}
	constructor(public type: SNBTTagType, public value: any) {}
	set(path: string, value: SNBTTag) {
		let parts = path.split(/(\[\-?\d+\])|\./g).filter(Boolean)
		return this._set(parts, value)
	}
	// traverse the path and set the value
	// if the path does not exist, create it
	// if the path is a list or compound, set the value at the given key,
	//TODO: validate the key is valid for the type
	_set(parts: string[], value: SNBTTag) {
		let key = parts.shift() as string
		// if (parts.length === 0) {
		//   this.value[key] = value;
		// }
		if (key.startsWith('[') && key.endsWith(']')) {
			key = key.substring(1, key.length - 1)
			if (
				this.type === SNBTTagType.INT_ARRAY ||
				this.type === SNBTTagType.LONG_ARRAY ||
				this.type === SNBTTagType.BYTE_ARRAY ||
				this.type === SNBTTagType.LIST
			) {
				if (parts.length === 0) {
					this.value[
						this.value.indexOf(this.value.at(parseInt(key)))
					] = value
				}
				let value2 = this.value.at(parseInt(key))
				return value2._set(parts, value)
			}
		}
		if (parts.length === 0) {
			if (
				this.type === SNBTTagType.COMPOUND ||
				this.type === SNBTTagType.LIST ||
				this.type === SNBTTagType.INT_ARRAY ||
				this.type === SNBTTagType.LONG_ARRAY ||
				this.type === SNBTTagType.BYTE_ARRAY
			) {
				this.value[key] = value
			}
			return this
		}
		if (!(key in this.value)) {
			this.value[key] = new SNBTTag(SNBTTagType.COMPOUND, {})
		}
		this.value[key]._set(parts, value)
		return this
	}
	_get(parts: string[]) {
		if (parts.length === 0) return this
		let key = parts.shift() as string
		if (key.startsWith('[') && key.endsWith(']')) {
			key = key.substring(1, key.length - 1)
			if (
				this.type === SNBTTagType.INT_ARRAY ||
				this.type === SNBTTagType.LONG_ARRAY ||
				this.type === SNBTTagType.BYTE_ARRAY ||
				this.type === SNBTTagType.LIST
			) {
				let value = this.value.at(parseInt(key))
				if (parts.length === 0) {
					return this.value
				}
				return value._get(parts)
			}
		}
		if (parts.length === 0) {
			return this.value[key]
		}
		if (!(key in this.value)) {
			return null
		}
		return this.value[key]._get(parts)
	}
	get(path: string): SNBTTag | null {
		let parts = path.split(/(\[\-?\d+\])|\./g).filter(Boolean)
		return this._get(parts)
	}
	//TODO: the BYTE_ARRAY, INT_ARRAY, and LONG_ARRAY types do not use the type prefix, they make a list with each entry being a Tag
	toString(flags: number = 0): string {
		const exclude_type = flags & SNBTStringifyFlags.EXCLUDE_TYPE
		switch (this.type) {
			case SNBTTagType.END:
				throw new Error('Cannot convert END tag to string')
			case SNBTTagType.BYTE:
				return this.value.toString() + (exclude_type ? '' : 'b')
			case SNBTTagType.SHORT:
				return this.value.toString() + (exclude_type ? '' : 's')
			case SNBTTagType.INT:
				return this.value.toString()
			case SNBTTagType.LONG:
				return this.value.toString() + (exclude_type ? '' : 'l')
			case SNBTTagType.FLOAT:
				return this.value.toString() + (exclude_type ? '' : 'f')
			case SNBTTagType.DOUBLE:
				return this.value.toString()
			case SNBTTagType.BYTE_ARRAY:
				return '[' + this.value.join(',') + ']'
			case SNBTTagType.STRING:
				return SNBTUtil.stringify(this.value)
			case SNBTTagType.LIST:
				return '[' + this.value.join(',') + ']'
			case SNBTTagType.COMPOUND:
				return (
					'{' +
					Object.entries(this.value as Record<any, SNBTTag>)
						.map(([key, value]) => `${key}:${value}`)
						.join(',') +
					'}'
				)
			case SNBTTagType.INT_ARRAY:
				return (
					'[I;' +
					this.value
						.map((v: SNBTTag) =>
							v.toString(SNBTStringifyFlags.EXCLUDE_TYPE)
						)
						.join(',') +
					']'
				)
			case SNBTTagType.LONG_ARRAY:
				return '[' + this.value.join(',') + ']'
			case SNBTTagType.BOOLEAN:
				return this.value ? 'true' : 'false'
		}
	}
	// clone the tag taking into account the type
	// the LIST, INT_ARRAY, BYTE_ARRAY, and LONG_ARRAY clone each item into a new list,
	// the COMPOUND copies each entry and makes a new compound
	clone(): SNBTTag {
		if (this.type === SNBTTagType.COMPOUND) {
			return new SNBTTag(
				this.type,
				Object.fromEntries(
					Object.entries(this.value as Record<string, SNBTTag>).map(
						([key, value]) => [key, value.clone()]
					)
				)
			)
		}
		if (
			this.type === SNBTTagType.LIST ||
			this.type === SNBTTagType.INT_ARRAY ||
			this.type === SNBTTagType.LONG_ARRAY ||
			this.type === SNBTTagType.BYTE_ARRAY
		) {
			return new SNBTTag(
				this.type,
				(this.value as SNBTTag[]).map((v) => v.clone())
			)
		}
		return new SNBTTag(this.type, this.value)
	}
}

const SNBTUtil = {
	//TODO: this does not correctly handle escaped characters
	// it should be able to handle escaped characters such as \n \t \s where
	// the result of the escape sequence is not the character after the \
	unescape(str: string) {
		return str.replace(/\\(.)/g, '$1')
	},

	parseString(str: string): string {
		if (str[0] === "'" && str[str.length - 1] === "'") {
			return SNBTUtil.unescape(str.slice(1, str.length - 1))
		}
		if (str[0] === '"' && str[str.length - 1] === '"') {
			return SNBTUtil.unescape(str.slice(1, str.length - 1))
		}
		throw new Error('Invalid string')
	},
	stringify(str: string) {
		const hasSingleQuote = str.indexOf("'") !== -1
		const hasDoubleQuote = str.indexOf('"') !== -1
		if (hasSingleQuote || hasDoubleQuote) {
			if (!hasSingleQuote && hasDoubleQuote) {
				return `'${str}'`
			} else if (hasSingleQuote && !hasDoubleQuote) {
				return `"${str}"`
			}
			return `"${str.replace(/\"/g, '\\"')}"`
		}
		return `'${str}'`
	},
	TAG_Byte(value: number) {
		return new SNBTTag(SNBTTagType.BYTE, value)
	},
	TAG_Short(value: number) {
		return new SNBTTag(SNBTTagType.SHORT, value)
	},
	TAG_Int(value: number) {
		return new SNBTTag(SNBTTagType.INT, value)
	},
	TAG_Long(value: number) {
		return new SNBTTag(SNBTTagType.LONG, value)
	},
	TAG_Float(value: number) {
		return new SNBTTag(SNBTTagType.FLOAT, value)
	},
	TAG_Double(value: number) {
		return new SNBTTag(SNBTTagType.DOUBLE, value)
	},
	TAG_Byte_Array(value: SNBTTag[]) {
		return new SNBTTag(SNBTTagType.BYTE_ARRAY, value)
	},
	TAG_String(value: string) {
		return new SNBTTag(SNBTTagType.STRING, value)
	},
	TAG_List(value: SNBTTag[]) {
		return new SNBTTag(SNBTTagType.LIST, value)
	},
	TAG_Compound(value: Record<string, SNBTTag>) {
		return new SNBTTag(SNBTTagType.COMPOUND, value)
	},
	TAG_Int_Array(value: SNBTTag[]) {
		return new SNBTTag(SNBTTagType.INT_ARRAY, value)
	},
	TAG_Long_Array(value: SNBTTag[]) {
		return new SNBTTag(SNBTTagType.LONG_ARRAY, value)
	},
	TAG_Boolean(value: boolean) {
		return new SNBTTag(SNBTTagType.BOOLEAN, value)
	},
	TAG_End() {
		return new SNBTTag(SNBTTagType.END, null)
	},
}
// this class is used for itterating over a string.
// supports things such as look ahead and look behind, read, readUntilX
class StringReader {
	cursor: number
	str: string
	constructor(str: string) {
		this.cursor = 0
		this.str = str.trim()
	}
	read(length: number) {
		const result = this.str.substr(this.cursor, length)
		this.cursor += length
		if (this.cursor > this.str.length) {
			throw new Error('Unexpected end of string')
		}
		return result
	}
	readUntil(char: string) {
		const result = this.str.substr(this.cursor)
		const index = result.indexOf(char)
		if (index === -1) {
			throw new Error('Unexpected end of string')
		}
		this.cursor += index + 1
		return result.substr(0, index)
	}
	peek(length: number) {
		return this.str.substr(this.cursor, length)
	}
	peekReversed(length: number) {
		if (this.cursor - length < 0) {
			return null
		}
		return this.str.substr(this.cursor - length, length)
	}
	peekUntil(char: string) {
		return this.str.substr(this.str.indexOf(char, this.cursor))
	}
	skip(length: number) {
		this.cursor += length
		if (this.cursor > this.str.length) {
			throw new Error('Unexpected end of string')
		}
	}
	skipUntil(char: string) {
		const index = this.str.indexOf(char, this.cursor)
		if (index === -1) {
			throw new Error('Unexpected end of string')
		}
		this.cursor += index + 1
	}
	skipWhitespace() {
		while (
			(this.peek(1) === ' ' ||
				this.peek(1) === '\n' ||
				this.peek(1) === '\r' ||
				this.peek(1) === '\t') &&
			this.remaining() > 0
		) {
			this.skip(1)
		}
	}
	isEnd() {
		return this.cursor >= this.str.length
	}
	fork() {
		return new StringReader(this.str.substr(this.cursor))
	}
	readString() {
		const start = this.cursor
		if (this.peek(1) === '"') this.skip(1)
		while (
			this.peek(1) !== '"' &&
			this.peekReversed(1) !== '\\' &&
			!this.isEnd()
		) {
			this.skip(1)
		}
		if (this.isEnd()) {
			throw new Error('Unexpected end of string')
		}
		this.skip(1)
		const end = this.cursor
		return this.str.substr(start, end - start)
	}
	readSingleQuotedString() {
		const start = this.cursor
		if (this.peek(1) === "'") this.skip(1)
		while (
			this.peek(1) !== "'" &&
			this.peekReversed(1) !== '\\' &&
			!this.isEnd()
		) {
			this.skip(1)
		}
		if (this.isEnd()) {
			throw new Error('Unexpected end of string')
		}
		this.skip(1)
		const end = this.cursor
		return this.str.substr(start, end - start)
	}
	readUntilMatchingBracket(bracketOpen: string, bracketClose: string) {
		const start = this.cursor
		let count = this.peek(1) === bracketOpen ? 1 : 0
		this.skip(count)
		let inString: '"' | "'" | null = null
		while (count > 0) {
			if (this.isEnd()) throw new Error('Unmatched Brackets')
			if (inString !== null) {
				if (this.peek(1) === inString) inString = null
			} else if (this.peek(1) === '"') {
				inString = '"'
			} else if (this.peek(1) === "'") {
				inString = "'"
			} else if (inString === null && this.peek(1) === bracketOpen) {
				count++
			} else if (this.peek(1) === bracketClose) {
				count--
			}
			this.skip(1)
		}
		const end = this.cursor
		// if (!this.isEnd()) this.skip(1)
		return this.str.substr(start, end - start)
	}
	readUntilAnyOf(chars: string[]) {
		const start = this.cursor
		while (!chars.some((char) => this.peek(1) === char) && !this.isEnd()) {
			this.skip(1)
		}
		const end = this.cursor
		this.skip(1)
		return this.str.substr(start, end - start)
	}
	hasCharInRest(char: string) {
		return this.str.indexOf(char, this.cursor) !== -1
	}
	readUntilNextLogicalBreakOrEnd() {
		if (this.peek(1) === '[') {
			return this.readUntilMatchingBracket('[', ']')
		}
		if (this.peek(1) === '{') {
			return this.readUntilMatchingBracket('{', '}')
		}
		if (this.peek(1) === "'") {
			return this.readSingleQuotedString()
		}
		if (this.peek(1) === '"') {
			return this.readString()
		}
		if (this.hasCharInRest(',')) {
			return this.readUntil(',')
		}
		return this.read(this.remaining())
	}
	readNumber() {
		const start = this.cursor
		if (this.peek(1) === '-') this.skip(1)
		while (
			this.peek(1) >= '0' &&
			this.peek(1) <= '9' &&
			this.remaining() > 0
		) {
			this.skip(1)
		}
		const end = this.cursor
		return this.str.substr(start, end - start)
	}
	remaining() {
		return this.str.length - this.cursor
	}
}
// the parser is used to parse the string into a tree of SNBTTag objects
class SNBTParser {
	reader: StringReader
	constructor(public input: string) {
		this.reader = new StringReader(input)
	}
	parse() {
		this.reader.skipWhitespace()
		let result
		if (this.reader.peek(1) === '{') {
			result = this.parseCompound()
		} else if (this.reader.peek(3) === '[B;') {
			result = this.parseByteArray()
		} else if (this.reader.peek(3) === '[I;') {
			result = this.parseIntArray()
		} else if (this.reader.peek(3) === '[L;') {
			result = this.parseLongArray()
		} else if (this.reader.peek(1) === '[') {
			result = this.parseList()
		} else if (this.reader.peek(1) === '"') {
			result = this.parseString()
		} else if (this.reader.peek(1) === "'") {
			result = this.parseString()
		} else if (
			this.reader.peek(4) === 'true' ||
			this.reader.peek(5) === 'false'
		) {
			result = this.parseBoolean()
		} else if (
			this.reader.peek(1) === '-' ||
			this.reader.peek(1) === '.' ||
			(this.reader.peek(1) >= '0' && this.reader.peek(1) <= '9')
		) {
			result = this.parseNumber()
		} else {
			throw new Error('Unexpected character ' + this.reader.peek(1))
		}
		return result
	}
	parseCompound(): any {
		this.reader.skipWhitespace()
		// if (this.reader.peek(2) === '{}') return SNBTUtil.TAG_Compound({})
		let contents = this.reader
			.readUntilMatchingBracket('{', '}')
			.trim()
			.substring(1)
		contents = contents.substring(0, contents.length - 1)
		const reader = new StringReader(contents)
		let dict: Record<string, SNBTTag> = {}
		while (!reader.isEnd()) {
			if (reader.hasCharInRest(':')) {
				const name = reader.readUntil(':')
				const value = new SNBTParser(
					reader.readUntilNextLogicalBreakOrEnd()
				).parse()
				dict[name] = value
				if (reader.peek(1) === ',') reader.skip(1)
				reader.skipWhitespace()
			} else {
				throw new Error('Expected ":" in compound contents')
			}
		}
		return SNBT.Compound(dict)
	}
	parseByteArray(): any {
		this.reader.skip(3)
		const contents = this.reader.readUntilMatchingBracket('[', ']')
		const reader = new StringReader(contents)
		const result = []
		while (reader.hasCharInRest('b') && reader.remaining() > 0) {
			result.push(parseInt(reader.readUntil('b')))
			if (reader.peek(1) === ',') {
				reader.skip(1)
			}
		}
		return SNBT.Byte_Array(result)
	}
	parseIntArray(): any {
		this.reader.skip(3)
		const contents = this.reader.readUntilMatchingBracket('[', ']')
		const reader = new StringReader(contents)
		const result = []
		while (reader.hasCharInRest(',') && reader.remaining() > 0) {
			result.push(parseInt(reader.readUntil(',')))
		}
		return SNBT.Int_Array(result)
	}
	parseLongArray(): any {
		this.reader.skip(3)
		const contents = this.reader.readUntilMatchingBracket('[', ']')
		const reader = new StringReader(contents)
		const result = []
		while (reader.hasCharInRest('l') && reader.remaining() > 0) {
			result.push(parseInt(reader.readUntil('l')))
			if (reader.peek(1) === ',') {
				reader.skip(1)
			}
		}
		return SNBT.Long_Array(result)
	}
	parseList(): any {
		let contents = this.reader
			.readUntilMatchingBracket('[', ']')
			.substring(1)
		contents = contents.substring(0, contents.length - 1)
		const reader = new StringReader(contents)
		const result = []

		while (reader.remaining() > 0) {
			let peek = reader.peek(1)
			if (peek === "'") {
				result.push(
					new SNBTParser(reader.readSingleQuotedString()).parse()
				)
			} else if (peek === '"') {
				result.push(new SNBTParser(reader.readString()).parse())
			} else if (peek === '{') {
				result.push(
					new SNBTParser(
						reader.readUntilMatchingBracket('{', '}')
					).parse()
				)
			} else if (peek === '[') {
				result.push(
					new SNBTParser(
						reader.readUntilMatchingBracket('[', ']')
					).parse()
				)
			} else if (reader.hasCharInRest(',')) {
				result.push(new SNBTParser(reader.readUntil(',')).parse())
			} else {
				result.push(
					new SNBTParser(reader.read(reader.remaining())).parse()
				)
			}
			if (reader.peek(1) === ',') reader.skip(1)
		}
		return SNBT.List(result)
	}
	parseString(): any {
		if (this.reader.peek(1) === '"') {
			return SNBT.String(SNBTUtil.parseString(this.reader.readString()))
		} else {
			return SNBT.String(
				SNBTUtil.parseString(this.reader.readSingleQuotedString())
			)
		}
	}
	parseBoolean(): any {
		if (this.reader.peek(4) === 'true') {
			this.reader.skip(4)
			return SNBT.Boolean(true)
		} else {
			this.reader.skip(5)
			return SNBT.Boolean(false)
		}
	}
	parseNumber(): any {
		let int = this.reader.readNumber()
		let dec
		if (this.reader.peek(1) === '.') {
			this.reader.skip(1)
			dec = this.reader.readNumber()
		}
		if (this.reader.peek(1) === 'f') {
			this.reader.skip(1)
			return SNBT.Float(parseFloat(int + '.' + dec))
		}
		if (this.reader.peek(1) === 'd') {
			this.reader.skip(1)
			return SNBT.Double(parseFloat(int + '.' + dec))
		}
		if (this.reader.peek(1) === 'l') {
			this.reader.skip(1)
			return SNBT.Long(parseInt(int + '.' + dec))
		}
		if (this.reader.peek(1) === 's') {
			this.reader.skip(1)
			return SNBT.Short(parseInt(int + '.' + dec))
		}
		if (this.reader.peek(1) === 'b') {
			this.reader.skip(1)
			return SNBT.Byte(parseInt(int + '.' + dec))
		}
		if (this.reader.peek(1) === 'i') {
			this.reader.skip(1)
			return SNBT.Int(parseInt(int + '.' + dec))
		}
		if (!dec) {
			return SNBT.Int(parseInt(int))
		}
		return SNBT.Float(parseInt(int + '.' + dec))
	}
}
// a function that removes spaces and newlines from a string except when they are between " and '
export function removeSpacesAndNewlines(str: string): string {
	let result = ''
	let inString: false | string = false
	for (let i = 0; i < str.length; i++) {
		if (!inString && (str[i] === '"' || str[i] === "'")) {
			inString = str[i] as string
		} else if (inString && str[i] === inString && str[i - 1] !== '\\') {
			inString = false
		}
		if (!inString) {
			if (str[i] === ' ' && !inString) {
				continue
			}
			if (str[i] === '\n' && !inString) {
				continue
			}
		}
		result += str[i]
	}
	return result
}
export const SNBT = {
	parse(str: string): SNBTTag {
		let parser = new SNBTParser(removeSpacesAndNewlines(str.trim()))
		let result = parser.parse()
		if (!parser.reader.isEnd()) {
			throw new Error('finished reading before end of string.')
		}
		return result
	},
	// type creations
	Byte(v: number = 0) {
		//assert v is a number between -128 and 127
		assert(v >= -128 && v <= 127, 'Byte value must be between -128 and 127')
		return SNBTUtil.TAG_Byte(v)
	},
	Short(v: number = 0) {
		//assert v is a number between -32768 and 32767
		assert(
			v >= -32768 && v <= 32767,
			'Short value must be between -32768 and 32767'
		)
		return SNBTUtil.TAG_Short(v)
	},
	Int(v: number = 0) {
		//assert v is a number between -2147483648 and 2147483647
		assert(
			v >= -2147483648 && v <= 2147483647,
			'Int value must be between -2147483648 and 2147483647'
		)
		return SNBTUtil.TAG_Int(v)
	},
	Long(v: number = 0) {
		//assert v is a number between -9223372036854775808 and 9223372036854775807
		assert(
			v >= -9223372036854775808 && v <= 9223372036854775807,
			'Long value must be between -9223372036854775808 and 9223372036854775807'
		)
		return SNBTUtil.TAG_Long(v)
	},
	Float(v: number = 0) {
		//assert v is a number between -3.4028235e+38 and 3.4028235e+38
		assert(
			v >= -3.4028235e38 && v <= 3.4028235e38,
			'Float value must be between -3.4028235e+38 and 3.4028235e+38'
		)
		return SNBTUtil.TAG_Float(v)
	},
	Double(v: number = 0) {
		//assert v is a number between -1.7976931348623157e+308 and 1.7976931348623157e+308
		assert(
			v >= -1.7976931348623157e308 && v <= 1.7976931348623157e308,
			'Double value must be between -1.7976931348623157e+308 and 1.7976931348623157e+308'
		)
		return SNBTUtil.TAG_Double(v)
	},
	Byte_Array(v: number[] = []) {
		//assert v is an array of numbers between -128 and 127
		assert(
			every(v, (x) => x >= -128 && x <= 127),
			'Byte array values must be between -128 and 127'
		)
		return SNBTUtil.TAG_Byte_Array(v.map(SNBT.Byte))
	},
	String(v: string = '') {
		return SNBTUtil.TAG_String(v)
	},
	List(v: SNBTTag[] = []) {
		return SNBTUtil.TAG_List(v)
	},
	Compound(v: Record<string, SNBTTag> = {}) {
		return SNBTUtil.TAG_Compound(v)
	},
	Int_Array(v: number[] = []) {
		//assert v is an array of numbers between -2147483648 and 2147483647
		assert(
			every(v, (x) => x >= -2147483648 && x <= 2147483647),
			'Int array values must be between -2147483648 and 2147483647'
		)
		return SNBTUtil.TAG_Int_Array(v.map(SNBT.Int))
	},
	Long_Array(v: number[] = []) {
		//assert v is an array of numbers between -9223372036854775808 and 9223372036854775807
		assert(
			every(
				v,
				(x) => x >= -9223372036854775808 && x <= 9223372036854775807
			),
			'Long array values must be between -9223372036854775808 and 9223372036854775807'
		)
		return SNBTUtil.TAG_Long_Array(v.map(SNBT.Long))
	},
	Boolean(v: boolean = false) {
		return SNBTUtil.TAG_Boolean(v)
	},
	End() {
		return SNBTUtil.TAG_End()
	},
	merge(a: SNBTTag, b: SNBTTag) {
		const workingCopy = a.clone()
		workingCopy._merge(b)
		return workingCopy
	},
}
globalThis.SNBT = SNBT
