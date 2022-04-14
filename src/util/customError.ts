type CustomErrorOptions = {
	message?: string
	dialog?: DialogOptions
	showDialog?: boolean
	silent?: boolean
}

export class CustomError extends Error {
	message: string
	options: CustomErrorOptions
	constructor(message: string, options?: CustomErrorOptions) {
		super(message)
		this.options = options || {}
		this.options.message = message
	}
}
