export interface FormatObject {
	[index: string]: any
}

export function format(str: string, dict: FormatObject = {}) {
	const keys = Object.keys(dict).sort((a, b) => b.length - a.length)
	for (const target of keys)
		str = str.replace(new RegExp('%' + target, 'g'), dict[target])
	return str
}

export function safeFunctionName(s: string) {
	return s.toLowerCase().replace(/[^\w\d\._]+/g, '_')
}

export function safeEntityTag(s: string) {
	return s.replace(/[^\w\.\-+]+/g, '_')
}

export function fixIndent(str: string[]) {
	let indent = 0
	return str
		.join('\n')
		.split('\n')
		.map((_: any) => _.trim())
		.filter(Boolean)
		.map((_: any) => {
			if (_.startsWith('}')) {
				indent--
			}
			let v = '\t'.repeat(indent) + _
			if (_.endsWith('{')) {
				indent++
			}
			return v
		})
		.join('\n')
}
