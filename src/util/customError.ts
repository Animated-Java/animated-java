type CustomErrorOptions = {
	message?: string
	dialog?: DialogOptions
	intentional?: boolean
	silent?: boolean
}

export class CustomError extends Error {
	message: string
	options: CustomErrorOptions
	constructor(message: string, options?: any) {
		super(message)
		this.options = options || {}
		this.options.message = message
	}
}
