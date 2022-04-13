import LangMCWorkerURI from './dependencies/lang-mc-worker/lang-mc.worker.wjs'
export function compileMC(namespace, contents, config, onLog = console.log) {
	return new Promise((resolve, reject) => {
		const w = new Worker(LangMCWorkerURI)
		w.onmessage = e => {
			if (Array.isArray(e.data)) {
				resolve(e.data)
				w.terminate()
			} else {
				onLog(e.data)
			}
		}
		w.postMessage({
			namespace,
			contents,
			config,
		})
		w.onerror = e => {
			w.terminate()
			reject(e)
		}
	})
}
export function compileMCThreaded(namespace, contents, onLog) {
	return new Promise(async (resolve, reject) => {
		const segments = contents
			.split('#BUNDLED_THREAD_BREAK')
			.filter(v => {
				if (!v.length) return false
				let trimmed = v.trim()
				if (trimmed.startsWith('#BUNDLED_THREAD_MODE ignore')) return false
				return true
			})
			.map(s => {
				let code = s.trim()
				const v = {
					code,
					namespace: namespace,
					info: null,
				}
				const first_line = code.substr(0, code.indexOf('\n')).trim()
				if (first_line.startsWith('#BUNDLED_THREAD_INFO')) {
					v.info = first_line.substr(21).trim().split('/')
				}
				return v
			})
		console.log(segments)
		const finData = []
		function populateWorker(segment) {
			return new Promise((resolve, reject) => {
				const w = new Worker(LangMCWorkerURI)
				w.onmessage = e => {
					if (Array.isArray(e.data)) {
						resolve({
							data: e.data,
							worker: w,
						})
						w.terminate()
					} else {
						onLog(e.data)
					}
				}
				w.postMessage({
					namespace: segment.namespace,
					contents: segment.code,
					info: segment.info,
				})
				w.onerror = e => {
					w.terminate()
					reject(e)
				}
				w.postMessage(segment)
			})
		}
		let count = Math.min(2, segments.length)
		let p = []
		for (let i = 0; i < count; i++) {
			let w = populateWorker(segments.shift()).then(v => {
				finData.push(v.data)
				if (segments.length) {
					populateWorker(segments.shift())
				} else {
					resolve(finData)
				}
			})
			p.push(w)
		}
	})
}
window.compileMC = compileMC
window.compileMCThreaded = compileMCThreaded
