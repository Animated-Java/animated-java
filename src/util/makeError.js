function logHelper(name, error, meta, note) {
	console.groupCollapsed(
		name + '-' + error.message + ' (expand for more info)'
	)
	console.log(
		`An error has ocurred, this isn't necessarily an issue with your system, for more info please read the logs directly bellow this one`
	)

	if (meta) {
		console.log('this error included the following meta information')
		console.log(meta)
	}
	if (note) {
		console.log()
		console.log(note)
	}
	console.log()

	console.error(error)
	console.groupEnd()
}

export function makeError(name, message, note) {
	const error = new Function(
		'log',
		`return class ${name} extends Error{ constructor(meta){super(${JSON.stringify(
			message
		)});log(${JSON.stringify(name)},this,meta,${
			note ? JSON.stringify(note) : 'null'
		})}}`
	)(logHelper)
	return (meta) => {
		throw new error(meta)
	}
}
