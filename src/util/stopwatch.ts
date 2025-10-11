import { roundTo } from './misc'

export class Stopwatch {
	protected startTime?: number
	protected endTime?: number
	protected duration?: number

	constructor(readonly name: string) {}

	start() {
		if (this.startTime !== undefined) throw new Error('Stopwatch already started')
		this.startTime = performance.now()
		return this
	}

	/**
	 * Stops the stopwatch, and logs the duration to the console.
	 */
	debug(...extra: any[]) {
		this.stop()
		const message = this.createMessage()
		if (extra.length > 0) message[0] += '\n'
		console.log(...message, ...extra)
		return this
	}

	/**
	 * Stops the stopwatch, and returns the duration in milliseconds.
	 */
	stop() {
		if (this.startTime === undefined) throw new Error('Stopwatch not started')
		this.endTime = performance.now()
		this.duration = this.endTime - this.startTime

		return this.duration
	}

	private createMessage() {
		const durationMessage =
			this.duration === undefined ? 'Not finished' : `${roundTo(this.duration, 5)}ms`
		return [
			`%c⏱️ ${this.name}%c: %c${durationMessage}`,
			'color: #FFFF55',
			'color: #AAAAAA',
			'color: #55FFFF',
		]
	}

	/**
	 * Wraps a function to measure its execution time.
	 *
	 * If the function returns a promise, the duration will be tracked until the promise settles.
	 */
	static function<T extends (...args: any[]) => any>(name: string, func: T): T {
		return ((...args: Parameters<T>) => {
			const stopwatch = new Stopwatch(name).start()
			const result = func(...args)
			if (result instanceof Promise) {
				return result.finally(stopwatch.debug.bind(stopwatch))
			}
			stopwatch.debug()
			return result
		}) as T
	}

	/**
	 * Tracks the duration of a promise and logs it when the promise settles.
	 */
	static promise<T>(name: string, promise: Promise<T>): Promise<T> {
		const stopwatch = new Stopwatch(name).start()
		return promise.finally(stopwatch.debug.bind(stopwatch))
	}
}
