export class CompilerError extends Error {
	constructor(message, line = 'unknown') {
		super(message)
		this.line = line
	}
}

export class UserError extends Error {
	constructor(message, line = 'unknown') {
		super(message)
		this.line = line
	}
}
