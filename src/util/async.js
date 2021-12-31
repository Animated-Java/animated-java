let time = performance.now()
const next_tick = () => new Promise((resolve) => requestAnimationFrame(resolve))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const wait_if_overflow = async () => {
	if (performance.now() - time >= 16) {
		await next_tick()
		time = performance.now()
	}
}

export const Async = { next_tick, sleep, wait_if_overflow }
