import * as pathjs from 'path'
import * as fs from 'fs'

export class Path {
	path: string
	parts: Array<string>
	private parsed?: pathjs.ParsedPath

	constructor(...paths: Array<string> | Array<Path>) {
		this.path = pathjs.normalize(
			pathjs.join(...paths.map((p: any) => (p.path ? p.path : p)))
		)
		this.parts = this.path.split(pathjs.sep)
	}

	isFile(): boolean {
		try {
			return fs.lstatSync(this.path).isFile()
		} catch (e) {
			return false
		}
	}

	isDirectory(): boolean {
		try {
			return fs.lstatSync(this.path).isDirectory()
		} catch (e) {
			return false
		}
	}

	join(other: string | Path) {
		if (other instanceof Path) {
			return new Path(pathjs.join(this.path, other.path))
		}
		return new Path(pathjs.join(this.path, other))
	}

	exists(): boolean {
		return fs.existsSync(this.path)
	}

	parse(): pathjs.ParsedPath {
		if (!this.parsed) this.parsed = pathjs.parse(this.path)
		return this.parsed
	}

	mkdir(options?: fs.MakeDirectoryOptions & { recursive?: true }) {
		try {
			fs.mkdirSync(this.parse().dir, options)
		} catch (e) {
			console.error(e.message)
		}
	}

	write(
		data: string | NodeJS.ArrayBufferView,
		options?: fs.WriteFileOptions
	) {
		try {
			fs.writeFileSync(this.path, data, options)
		} catch (e) {
			console.error(e.message)
		}
	}
}
