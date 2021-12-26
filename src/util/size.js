export function size(item) {
	if (item instanceof Set || item instanceof Map) return item.size
	if (Array.isArray(item) || typeof item === 'string') return item.length
	if (typeof item === 'object') return Object.keys(item).length
	console.warn('unable to get size of item:', item)
	throw new Error(
		'unable to get size of item, please check your dev tools or see the log above this error for more info'
	)
}
