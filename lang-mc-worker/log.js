export function log(...args) {
	return self.postMessage({ channel: 'LOG', msg: args.join(' ') })
}
export function error(...args) {
	return self.postMessage({ channel: 'ERR', msg: args.join(' ') })
}
export function warn(...args) {
	return self.postMessage({ channel: 'WRN', msg: args.join(' ') })
}
export function info(...args) {
	return self.postMessage({ channel: 'INF', msg: args.join(' ') })
}
export function task(...args) {
	return self.postMessage({ channel: 'TSK', msg: args.join(' ') })
}
export default {
	log,
	error,
	warn,
	info,
	task,
}
