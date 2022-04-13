import * as fs from 'fs'
import { Path } from './path'

type fileType = 'directory' | 'file'

function pushFileToDisk(path: string, content: any) {
	try {
		fs.writeFileSync(path, content, {
			encoding: 'utf-8',
		})
	} catch (e) {
		console.error(e.message)
	}
}

export class dirTreeItem {
	name: string
	path: Path
	type: fileType
	extension: string
	content?: any
	children?: Array<dirTreeItem>

	constructor(
		name: string,
		path: Path,
		type: fileType,
		extension: string,
		content?: any,
		children?: Array<dirTreeItem>
	) {
		this.name = name
		this.path = path
		this.type = type
		this.extension = extension
		this.content = content
		this.children = children
	}

	exportToPath() {
		if (this.type == 'directory') {
			this.path.mkdir()
		} else if (this.type == 'file') {
			this.path.write(this.content)
		}

		this.children?.forEach(child => child.exportToPath())
	}

	toJSON() {
		return {
			name: this.name,
			path: this.path,
			type: this.type,
			extension: this.extension,
			content: this.content,
			children: this.children,
		}
	}
}
