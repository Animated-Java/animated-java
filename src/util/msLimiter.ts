/**
 * An class that lets you limit how much time something can take per frame.
 */
export class MSLimiter {
	lastTime: number
	constructor(public limit: number) {
		this.lastTime = performance.now()
	}

	async sync() {
		const now = performance.now()
		const diff = now - this.lastTime
		if (diff >= this.limit) {
			await new Promise(r => requestAnimationFrame(r))
			this.lastTime = performance.now()
			return true
		}
		return false
	}
}
