export class CustomError extends Error {
	options: any
	constructor(options: any) {
		super()
		this.options = options
	}
}
