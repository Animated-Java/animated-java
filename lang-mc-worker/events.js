const events = { end: [], start: [] }
export default {
	emit(event) {
		self.postMessage({ channel: 'EVT', msg: event })
		if (events[event]) events[event].forEach((fn) => fn())
	},
	on(a, b) {
		events[a].push(b)
	},
}
