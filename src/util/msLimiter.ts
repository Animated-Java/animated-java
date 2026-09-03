/**
 * An class that lets you limit how much time something can take per frame.
 */
export class MSLimiter {
	lastTime: number
	constructor(public limit: number) {
		this.lastTime = performance.now()
	}

	/** True when {@link sync} would actually yield - lets a hot loop skip `await` entirely. */
	needsSync() {
		return performance.now() - this.lastTime >= this.limit
	}

	async sync() {
		if (!this.needsSync()) return false
		await new Promise(r => requestAnimationFrame(r))
		this.lastTime = performance.now()
		return true
	}
}
