// You know how console.log is slow? What if we made it even slower, but only specific functions? :D

const originalConsoleLog = console.log

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
		var lastConsoleLog = console.log
		var used = forced
		if (used) console.group(groupName)
		else {
			console.log = function (...args) {
				if (!used) {
					used = true
					if (lastConsoleLog !== originalConsoleLog) lastConsoleLog()
					console.group(groupName)
				}
				return (console.log = lastConsoleLog)(...args)
			}
		}
		const result = fn(...args)
		if (used) console.groupEnd()
		else console.log = lastConsoleLog
		return result
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
		var lastConsoleLog = console.log
		var used = forced
		if (used) console.groupCollapsed(groupName)
		else {
			console.log = function (...args) {
				if (!used) {
					used = true
					if (lastConsoleLog !== originalConsoleLog) lastConsoleLog()
					console.groupCollapsed(groupName)
				}
				return (console.log = lastConsoleLog)(...args)
			}
		}
		const result = fn(...args)
		if (used) console.groupEnd()
		else console.log = lastConsoleLog
		return result
	}
}
