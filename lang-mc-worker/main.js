const fs = require('fs')
const Worker = require('web-worker')

const worker = new Worker('./web_worker.js')
let source = {}
source.namespace = 'chest'
source.contents = fs.readFileSync('./test.mc', 'utf8')

worker.postMessage(source)

worker.addEventListener('message', (e) => {
	console.log(e.data) // for virtual file system: array of objects with properties _contents and _path
	// for logging: object with properties channel and msg
})
