import { SNBT } from './SNBT'

class SNBTError extends Error {
	constructor(message: string) {
		super(message)
	}
}

class Iter {
	list: string[]
	item?: string
	index: number

	constructor(str: string) {
		this.list = str.split('')
		this.index = -1
		this.next()
	}
	look() {
		return this.list[this.index + 1]
	}
	next() {
		this.index++
		this.item = this.list[this.index]
		return this.item
	}
}

const regex = {
	whiteSpace: /\s/,
	compoundKeyChars: /\w/,
}

export function parse(str: string) {
	const iter = new Iter(str)

	function skipWhitespace() {
		const start = iter.index
		while (iter.item.match(regex.whiteSpace)) {
			iter.next()
		}
		if (start != iter.index) {
			console.log(`Skipped whitespace: ${start}-${iter.index}`)
		}
	}

	function parseCompoundKey() {
		console.group('parseCompoundKey')
		let key = ''
		while (iter.item.match(regex.compoundKeyChars)) {
			console.log(iter.item)
			key += iter.item
			iter.next()
		}
		console.log('full key:', key)
		console.groupEnd()
		return key
	}

	function parseList() {
		console.group('parseList')
		const start = iter.index
		iter.next() // Skip the opening bracket
		while (iter.item) {
			console.log(iter.item)
			if (iter.item === ']') {
				iter.next() // Skip the end bracket
				console.groupEnd()
				return SNBT.List()
			}
			iter.next()
		}
		console.groupEnd()
		throw new SNBTError(
			`Unexpected EOF while parsing list at char ${start}`
		)
	}

	function parseCompoundValue() {
		switch (iter.item) {
			case '{':
				return parseCompound()
			case '[':
				return parseList()
		}
		throw new SNBTError(`Unexpected '${iter.item}' at char ${iter.index}`)
	}

	function parseCompound() {
		const compound = SNBT.Compound()
		iter.next() // Skip the opening bracket
		while (iter.item) {
			skipWhitespace()
			if (iter.item.match(regex.compoundKeyChars)) {
				const key = parseCompoundKey()
				skipWhitespace()
				if (!(iter.item === ':')) {
					throw new SNBTError(`Expected : at char ${iter.index}`)
				}
				skipWhitespace()
				iter.next()
				const value = parseCompoundValue()
				compound.set(key, value)
				console.log('New tag:', key, value)

				skipWhitespace()
				// @ts-ignore
				if (iter.item === '}') continue
				//
			} else if (iter.item === '}') {
				console.log('return compound')
				iter.next() // Skip end bracket
				return compound
				//
			} else {
				throw new SNBTError(
					`Unexpected '${iter.item}' at char ${iter.index}`
				)
			}

			console.log(
				'item',
				iter.item,
				iter.item.match(regex.compoundKeyChars)
			)
			iter.next()
		}
	}

	skipWhitespace()
	if (iter.item !== '{') throw new SNBTError('NBT root must be a compound')
	return parseCompound()
}
