// You know how console.log is slow? What if we made it even slower, but only specific functions? :D

const OG_LOG = console.log

function consoleGroupFunctionFactory(consoleGroupFunction: typeof console.group) {
	return function consoleGroup<A extends unknown[], R = unknown>(
		groupName: string,
		fn: (...args: A) => R,
		forced = false
	): (...args: A) => R {
		return (...args: A): R => {
			const lastConsoleLog = console.log
			let used = forced
			try {
				if (used) consoleGroupFunction(groupName)
				else {
					console.log = function (...args) {
						if (!used) {
							used = true
							if (lastConsoleLog !== OG_LOG) lastConsoleLog()
							consoleGroupFunction(groupName)
						}
						return (console.log = lastConsoleLog)(...args)
					}
				}
				const result = fn(...args)
				if (used) console.groupEnd()
				console.log = lastConsoleLog
				return result
			} catch (e) {
				if (used) console.groupEnd()
				console.log = lastConsoleLog
				throw e
			}
		}
	}
}

/**
 * Groups all console output in a function call into a console group
 * @param groupName The name of the group
 * @param fn The function to call
 * @param forced If true, the group will be opened even if no console output is made
 */
export const consoleGroup = consoleGroupFunctionFactory(console.group)

/**
 * Groups all console output in a function call into a collapsed console group
 * @param groupName The name of the group
 * @param fn The function to call
 * @param forced If true, the group will be opened even if no console output is made
 */
export const consoleGroupCollapsed = consoleGroupFunctionFactory(console.groupCollapsed)
