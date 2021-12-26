export function format(str: string, dict = {}) {
	const keys = Object.keys(dict).sort((a, b) => b.length - a.length)
	for (const target of keys)
		str = str.replace(new RegExp('%' + target, 'g'), dict[target])
	return str
}

export function safe_function_name(s: string) {
	return s.toLowerCase().replace(/[^a-z0-9\._]/g, '_')
}

export function fix_indent(str: string[]) {
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
