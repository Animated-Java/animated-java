class Intl {
	constructor(lang) {
		this.dict = {}
		this.lang = Settings.stored.language?.value || 'en'
		this.languages = []
		this.tokens = new Set()
		window.TRANSLATION_KEYS = this.tokens
	}
	setLanguage(lang) {
		this.lang = lang
	}
	translate(key) {
		this.tokens.add(key)
		let v = this.dict[this.lang]?.[key] ? this.dict[this.lang][key] : key
		if (v === key) debugger
		return v
	}
	register(name, dict) {
		this.dict[name] = dict
	}
}

export const intl = new Intl('en')
export const translate = (key) => intl.translate(key)
