// TODO - only print a group if console.log is called inside the wrapped function
/**
 * Groups all console output in a function call into a single group
 */
export function consoleGroup<A extends any[], R>(
	groupName: string,
	fn: (...args: A) => R
): (...args: A) => R {
	return (...args: A): R => {
		console.group(groupName)
		const ret = fn(...args)
		console.groupEnd()
		return ret
	}
}

/**
 * Groups all console output in a function call into a single collapsed group
 */
export function consoleGroupCollapsed<A extends any[], R>(
	groupName: string,
	fn: (...args: A) => R
): (...args: A) => R {
	return (...args: A): R => {
		console.groupCollapsed(groupName)
		const ret = fn(...args)
		console.groupEnd()
		return ret
	}
}
