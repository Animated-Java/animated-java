export class CustomError extends Error {
	options: any
	constructor(message: string, options?: any) {
		super()
		this.message = message
		this.options = options || {}
		this.options.message = message
	}
}
