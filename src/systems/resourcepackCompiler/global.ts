import { sortObjectKeys } from '../util'

export class ResourcePackAJMeta {
	public files = new Set<string>()
	public oldFiles = new Set<string>()
	private oldContent: Record<string, { files?: string[] }> = {}

	constructor(
		public path: string,
		public exportNamespace: string,
		public lastUsedExportNamespace: string,
		public resourcePackFolder: string
	) {}

	read() {
		if (!fs.existsSync(this.path)) return
		this.oldContent = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
		const data = this.oldContent[this.exportNamespace]
		const lastData = this.oldContent[this.lastUsedExportNamespace]
		if (lastData) {
			if (!Array.isArray(lastData.files)) lastData.files = []
			for (const file of lastData.files) {
				this.oldFiles.add(PathModule.join(this.resourcePackFolder, file))
			}
			delete this.oldContent[this.lastUsedExportNamespace]
		}
		if (data) {
			if (!Array.isArray(data.files)) data.files = []
			for (const file of data.files) {
				this.oldFiles.add(PathModule.join(this.resourcePackFolder, file))
			}
			delete this.oldContent[this.exportNamespace]
		}
	}

	write() {
		const folder = PathModule.dirname(this.path)
		const content: ResourcePackAJMeta['oldContent'] = {
			...this.oldContent,
			[this.exportNamespace]: {
				files: Array.from(this.files).map(v =>
					PathModule.relative(folder, v).replace(/\\/g, '/')
				),
			},
		}
		fs.writeFileSync(this.path, autoStringify(sortObjectKeys(content)))
	}
}
