// You know how console.log is slow? What if we made it even slower, but only specific functions? :D

function getConsoleObj(consoleClass: Console) {
	return Object.fromEntries(Object.entries(consoleClass)) as Console
}

function overwriteConsole(consoleObj: Console) {
	Object.assign(console, consoleObj)
}

function mapFuncToConsoleObj(consoleClass: Console, func: (fn: any, original: any) => any) {
	for (const [k, v] of Object.entries(consoleClass)) {
		if (typeof v === 'function') {
			// @ts-ignore
			consoleClass[k] = func(func, v)
		}
	}
	return consoleClass
}

// Original console functions
const CONSOLE = getConsoleObj(console)

function consoleGroupFunctionFactory(consoleGroupFunction: typeof console.group) {
	return function consoleGroup<A extends unknown[], R = unknown>(
		groupName: string,
		wrappedFunction: (...args: A) => R,
		forced = false
	): (...args: A) => R {
		return (...args: A): R => {
			const lastConsole = getConsoleObj(console)
			let used = forced

			if (used) consoleGroupFunction(groupName)
			else
				mapFuncToConsoleObj(console, (func, original) => {
					return (...args: unknown[]) => {
						if (!used) {
							used = true
							if (func !== original) func(...args)
							consoleGroupFunction(groupName)
						}
						overwriteConsole(lastConsole)
						return original(...args) as unknown
					}
				})

			try {
				const result = wrappedFunction(...args)
				if (used) CONSOLE.groupEnd()
				overwriteConsole(lastConsole)
				return result
			} catch (e) {
				if (used) CONSOLE.groupEnd()
				overwriteConsole(lastConsole)
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
