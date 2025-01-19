import { sortObjectKeys } from './util'

export class AJMeta {
	public files = new Set<string>()
	public oldFiles = new Set<string>()
	private oldContent: Record<string, { files?: string[] }> = {}

	constructor(
		public path: string,
		public blueprintID: string,
		public lastBlueprintID: string,
		public rootFolder: string
	) {}

	read() {
		if (!fs.existsSync(this.path)) return
		this.oldContent = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
		const data = this.oldContent[this.blueprintID]
		const lastData = this.oldContent[this.lastBlueprintID]
		if (lastData) {
			if (!Array.isArray(lastData.files)) lastData.files = []
			for (const file of lastData.files) {
				this.oldFiles.add(PathModule.join(this.rootFolder, file))
			}
			delete this.oldContent[this.lastBlueprintID]
		}
		if (data) {
			if (!Array.isArray(data.files)) data.files = []
			for (const file of data.files) {
				this.oldFiles.add(PathModule.join(this.rootFolder, file))
			}
			delete this.oldContent[this.blueprintID]
		}
	}

	write() {
		const folder = PathModule.dirname(this.path)
		const content: AJMeta['oldContent'] = {
			...this.oldContent,
			[this.blueprintID]: {
				files: Array.from(this.files).map(v =>
					PathModule.relative(folder, v).replace(/\\/g, '/')
				),
			},
		}
		fs.writeFileSync(this.path, autoStringify(sortObjectKeys(content)))
	}
}
