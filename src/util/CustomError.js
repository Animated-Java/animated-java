export class CustomError extends Error {
	constructor(options) {
		super()
		this.options = options
	}
}
