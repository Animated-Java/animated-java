export interface FormatObject {
	[index: string]: any
}

export function format(str: string, formatObj: FormatObject = {}) {
	const keys = Object.keys(formatObj).sort((a, b) => b.length - a.length)
	for (const target of keys) str = str.replace(new RegExp('%' + target, 'g'), formatObj[target])
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
			let end
			if (_.startsWith('}')) {
				end = true
				indent--
			}
			let v = '\t'.repeat(indent) + _
			if (_.endsWith('{')) indent++
			return v + (end ? '\n' : '')
		})
		.join('\n')
}
