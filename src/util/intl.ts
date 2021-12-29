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
	translate(key: string) {
		this.tokens.add(key)
		let v = this.dict[this.lang]?.[key] ? this.dict[this.lang][key] : key
		// if (v === key) debugger
		return v
	}
	register(name: string, dict: any) {
		this.dict[name] = dict
	}
}

export const intl = new Intl('en')
export const translate = (key: string) => intl.translate(key)
