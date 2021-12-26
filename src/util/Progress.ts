export class Progress {
	value: number
	max: number | undefined
	name: string
	message: string
	updateCallback?: (type: string, event: any) => void

	constructor(name: string, message?: string) {
		this.value = 0
		this.name = name
		this.message = message || 'Loading...'
	}

	setMax(n: number) {
		this.max = n
	}

	add(n: number) {
		this.value += n
		if (this.updateCallback) this.updateCallback('progress', this.value)
	}

	get(): number {
		if (this.max) return this.value / this.max
		return 0
	}

	setMessage(message: string) {
		this.message = message
		if (this.updateCallback) this.updateCallback('message', this.message)
		console.log(`[${this.name} progress]: ${message}`)
	}

	setUpdateCallback(func: (type: string, event: any) => void) {
		this.updateCallback = func
	}
}
