/**
 * Returns `name` if it isn't taken, otherwise appends (or increments) a numeric suffix until it isn't.
 */
export function makeUniqueName(name: string, isTaken: (name: string) => boolean): string {
	if (!isTaken(name)) return name

	let i = 1
	const match = /\d+$/.exec(name)
	if (match) {
		i = parseInt(match[0])
		name = name.slice(0, -match[0].length)
	}

	let maxTries = 1000
	while (maxTries-- > 0) {
		const newName = `${name}${i}`
		if (!isTaken(newName)) return newName
		i++
	}

	throw new Error(`Could not make name '${name}' unique!`)
}
