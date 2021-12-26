const fs = require('fs')
const Worker = require('web-worker')

const worker = new Worker('./dist/index.js')
let source = {}
source.namespace = 'chest'
source.contents = fs.readFileSync('./test.mc', 'utf8')

worker.postMessage(source)
let _id = 0
worker.addEventListener('message', ({ data: e }) => {
	//   console.log(_id++); // for virtual file system: array of objects with properties _contents and _path
	if (!Array.isArray(e)) {
		console.log(e)
	}
	// for logging: object with properties channel and msg
})
