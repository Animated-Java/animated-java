const originalConsoleLog = console.log

// You know how console.log is slow? What if we made it even slower, but only specific functions? :D

/**
 * Groups all console output in a function call into a console group
 * @param groupName The name of the group
 * @param fn The function to call
 * @param forced If true, the group will be opened even if no console output is made
 */
export function consoleGroup<A extends any[], R>(
	groupName: string,
	fn: (...args: A) => R,
	forced = false
): (...args: A) => R {
	return (...args: A): R => {
		let logUsed = forced
		if (logUsed) console.group(groupName)
		else {
			console.log = function (...args) {
				if (!logUsed) {
					logUsed = true
					console.group(groupName)
				}
				return (console.log = originalConsoleLog)(...args)
			}
		}
		const ret = fn(...args)
		if (logUsed) console.groupEnd()
		return ret
	}
}

/**
 * Groups all console output in a function call into a collapsed console group
 * @param groupName The name of the group
 * @param fn The function to call
 * @param forced If true, the group will be opened even if no console output is made
 */
export function consoleGroupCollapsed<A extends any[], R>(
	groupName: string,
	fn: (...args: A) => R,
	forced = false
): (...args: A) => R {
	return (...args: A): R => {
		let logUsed = forced
		if (logUsed) console.groupCollapsed(groupName)
		else {
			console.log = function (...args) {
				if (!logUsed) {
					logUsed = true
					console.groupCollapsed(groupName)
				}
				return (console.log = originalConsoleLog)(...args)
			}
		}
		const ret = fn(...args)
		if (logUsed) console.groupEnd()
		return ret
	}
}
