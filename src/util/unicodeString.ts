export class UnicodeString {
	static regex = /[^]/gmu

	private chars: string[] = []

	constructor(public str: string) {
		if (str === '') return
		for (const char of str.matchAll(UnicodeString.regex)) {
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
