import { compile } from './entry.js'
import './extra'
import vFileSystem from './vFileSystem.js'

self.onmessage = (source) => {
	compile(source.data.contents, source.data.namespace, source.data.config)
	self.postMessage(vFileSystem.map((item) => item.out()))
}
