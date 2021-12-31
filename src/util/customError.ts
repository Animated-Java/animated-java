export class CustomError extends Error {
	options: any
	constructor(message: string, options?: any) {
		super()
		this.message = message
		if (options) {
			options.message = message
			this.options = options
		}
	}
}
