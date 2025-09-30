import { StringStream } from 'generic-stream'
import { TextDisplay } from 'src/outliner/textDisplay'
import { events } from './events'

const ESCAPE_SEQUENCES = {
	'\\': '\\',
	"'": "'",
	'"': '"',
	n: '\n',
	s: ' ',
	t: '\t',
	b: '\b',
	f: '\f',
	r: '\r',
}

const unicodeCharMap = new Map<string, string>()

async function loadUnicodeCharMappings() {
	const response = await fetch('https://unicode.org/Public/UNIDATA/UnicodeData.txt')
	const text = await response.text()

	unicodeCharMap.clear()
	const lines = text.split('\n')
	for (const line of lines) {
		const parts = line.split(';')
		const codePointHex = parts[0]
		const name = parts[1]
		const codePoint = parseInt(codePointHex, 16)
		if (isNaN(codePoint) || name === '<control>' || name === '') continue
		unicodeCharMap.set(name, String.fromCodePoint(codePoint))
	}

	console.log(`Loaded ${unicodeCharMap.size} Unicode character mappings`, unicodeCharMap)

	for (const textDisplay of TextDisplay.all) {
		void textDisplay.updateText()
	}
}

events.NETWORK_CONNECTED.subscribe(() => {
	void loadUnicodeCharMappings()
})

function collectHexDigits(s: StringStream, count: number): string {
	let hex = ''
	for (let i = 0; i < count; i++) {
		if (s.item && /[0-9a-fA-F]/.test(s.item)) {
			hex += s.item
			s.consume()
		} else {
			throw new Error(
				`Expected ${count} hex digits in unicode escape sequence, got only ${i}`
			)
		}
	}
	return hex
}

function resolveNamedUnicodeEscapeSequence(s: StringStream): string {
	if (s.next !== '{') {
		console.warn(`Expected 'N{' to begin named unicode escape sequence`)
		return '\\N'
	}
	s.consume() // N
	s.consume() // {

	let name = ''
	while (s.item && s.item !== '}') {
		name += s.item
		s.consume()
	}
	name = name.trim().toUpperCase()

	if (name.length === 0) {
		console.warn(`Expected name in named unicode escape sequence`)
		return '\\N{}'
	}

	if ((s.item as string) !== '}') {
		console.warn(`Expected '}' to end named unicode escape sequence`)
		return `\\N{${name}`
	}
	s.consume() // }

	if (unicodeCharMap.has(name)) {
		return unicodeCharMap.get(name)!
	}

	return `\\N{${name}}`
}

function resolveUnicodeEscapeSequence(s: StringStream): string {
	if (!'xuU'.includes(s.item!)) {
		console.warn(`Expected 'x', 'u', or 'U' to begin unicode escape sequence`)
		return '\\' + s.item
	}
	const char = s.item!
	const expectedHexLength = s.item === 'x' ? 2 : s.item === 'u' ? 4 : 8
	s.consume() // u
	const hex = collectHexDigits(s, expectedHexLength)

	const codePoint = parseInt(hex, 16)
	if (isNaN(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
		console.warn(`Invalid unicode code point: ${hex}`)
		return `\\${char}${hex}`
	}
	return String.fromCodePoint(codePoint)

	return `\\${char}${hex}`
}

function resolveEscapeSequences(str: string): string {
	let resolved = ''
	const s = new StringStream(str)

	while (s.item) {
		if (s.item === '\\') {
			const escaped = s.look(1)
			if (
				(escaped === '\\' ||
					escaped === "'" ||
					escaped === '"' ||
					escaped === 'n' ||
					escaped === 's' ||
					escaped === 't' ||
					escaped === 'b' ||
					escaped === 'f' ||
					escaped === 'r') &&
				ESCAPE_SEQUENCES[escaped]
			) {
				if (ESCAPE_SEQUENCES[escaped]) {
					s.consume() // Consume the backslash
					s.consume() // Consume the escaped character
					resolved += ESCAPE_SEQUENCES[escaped]
					continue
				}
			} else if (escaped === 'N') {
				s.consume() // Consume the backslash
				resolved += resolveNamedUnicodeEscapeSequence(s)
				continue
			} else if (escaped === 'u' || escaped === 'U' || escaped === 'x') {
				s.consume() // Consume the backslash
				resolved += resolveUnicodeEscapeSequence(s)
				continue
			}
			// If it's not a recognized escape sequence, keep the backslash
		}
		resolved += s.item
		s.consume()
	}

	return resolved
}

export class UnicodeString {
	static regex = /[^]/gmu

	public str: string

	private chars: string[] = []

	constructor(str: string) {
		this.str = str

		if (this.str === '') return

		this.str = resolveEscapeSequences(str)

		for (const char of this.str.matchAll(UnicodeString.regex)) {
			this.chars.push(char[0])
		}
	}

	[Symbol.iterator]() {
		return this.chars[Symbol.iterator]()
	}

	get length() {
		return this.chars.length
	}

	includes(search: string) {
		return this.chars.includes(search)
	}

	indexOf(search: string) {
		return this.chars.indexOf(search)
	}

	slice(start: number, end?: number) {
		const chars = this.chars.slice(start, end)
		return UnicodeString.fromChars(chars)
	}

	at(index: number) {
		if (index < 0 || index >= this.chars.length) return undefined
		return this.chars[index]
	}

	append(char: string) {
		this.chars.push(char)
		this.str += char
	}

	toString() {
		return this.str
	}

	static fromChars(chars: string[]) {
		return new UnicodeString(chars.join(''))
	}
}
