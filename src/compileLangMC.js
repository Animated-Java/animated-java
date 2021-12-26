import LangMCWorkerURI from './dependencies/lang-mc-worker/lang-mc.worker.wjs'
export function compileMC(namespace, contents, onLog = console.log) {
	return new Promise((resolve, reject) => {
		const w = new Worker(LangMCWorkerURI)
		w.onmessage = (e) => {
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
		})
		w.onerror = (e) => {
			w.terminate()
			reject(e)
		}
	})
}
window.compileMC = compileMC
