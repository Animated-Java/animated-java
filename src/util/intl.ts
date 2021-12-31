class Intl {
	dict: any
	lang: string
	languages: string[]
	tokens: Set<any>
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
	tl(key: string) {
		this.tokens.add(key)
		let v = this.dict[this.lang]?.[key] ? this.dict[this.lang][key] : key
		// if (v === key) debugger
		return v
	}
	register(name: string, dict: any) {
		this.dict[name] = dict
	}
	diff(showDefaultValues: boolean) {
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
export const tl = (key: string) => intl.tl(key)
