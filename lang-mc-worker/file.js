import vFileSystem from './vFileSystem'

export class File {
	getPath() {
		return this._path
	}
	setPath(path) {
		this._path = path
	}
	getContents() {
		return this._contents
	}
	setContents(contents) {
		this._contents = contents
	}
	confirm() {
		vFileSystem.push(this)
	}
	unregister() {
		if (vFileSystem.indexOf(this) != -1) {
			vFileSystem.splice(vFileSystem.indexOf(this), 1)
		}
	}
	out() {
		return {
			path: this.getPath(),
			contents: this.getContents(),
		}
	}
}
