type CustomErrorOptions = {
	message?: string
	dialog?: DialogOptions
	silent?: boolean
}

export class CustomError extends Error {
	message: string
	options: CustomErrorOptions
	constructor(message: string, options?: any) {
		console.log(message)
		super(message)
		this.options = options || {}
		this.options.message = this.message
	}
}
