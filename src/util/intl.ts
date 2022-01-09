import { format, FormatObject } from './replace'

class Intl {
	dict: any
	lang: string
	languages: string[]
	tokens: Set<any>
	static translationCache: {[index: string]: string} = {}

	constructor(lang: string) {
		this.dict = {}
		// @ts-ignore
		this.lang = Settings.stored.language?.value || 'en'
		this.languages = []
		this.tokens = new Set()
		// window.TRANSLATION_KEYS = this.tokens
	}
	setLanguage(lang: string) {
		this.lang = lang
	}
	tl(tlPath: string, raw?: boolean) {
		if (Object.prototype.hasOwnProperty.call(Intl.translationCache, tlPath)) {
			return Intl.translationCache[tlPath]
		}

		let lang = this.dict[this.lang]
		function recurse(_keyPath: string[], obj: object) {
			const key = _keyPath.pop()
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				const value = obj[key]
				switch (typeof value) {
					case 'string':
						return value
					case 'object':
						if (Array.isArray(value)) {
							if (raw) return value.join('')
							return value.join('<br/>')
						}
						return recurse(_keyPath, value)
				}
			}
			return tlPath
		}
		if (!lang) return tlPath
		const translatedString = recurse(tlPath.split('.').reverse(), lang)
		Intl.translationCache[tlPath] = translatedString
		return translatedString
	}
	// tl(key: string) {
	// 	let segments = key.split('.')
	// 	let dict = this.dict[this.lang]
	// 	for (let i = 0; i < segments.length; i++) {
	// 		if (dict[segments[i]]) {
	// 			dict = dict[segments[i]]
	// 		} else {
	// 			this.tokens.add(key)
	// 			return key
	// 		}
	// 	}
	// 	return typeof dict === 'string' ? dict : key
	// }
	register(name: string, dict: any) {
		this.dict[name] = dict
	}
	diff(showDefaultValues: boolean) {
		throw new Error('Not implemented')
		let root = this.dict.en
		let diff = []
		for (let lang in this.dict) {
			if (lang === 'en') continue
			diff.push(lang + ':')
			for (let key in this.dict[lang]) {
				if (key in root) continue
				diff.push(
					`	+ ${key} ${
						showDefaultValues ? '(' + this.dict.en[key] + ')' : ''
					}`
				)
			}
			for (let key in root) {
				if (key in this.dict[lang]) continue
				diff.push(
					`	- ${key} ${showDefaultValues ? '(' + root[key] + ')' : ''}`
				)
			}
		}
		console.log(diff.join('\n'))
	}
}

export const intl = new Intl('en')
export const tl = (key: string, formatObj?: FormatObject, raw?: boolean) => {
	let ret = intl.tl(key, raw)
	if (formatObj) {
		return format(ret, formatObj)
	}
	return ret
}
