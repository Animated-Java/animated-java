import { normalizePath } from '../../util/fileUtil'
import { IntentionalExportError } from '../exporter'
import { sortObjectKeys } from '../util'

interface OldSerializedAJMeta {
	[key: string]: {
		files?: string[]
	}
}

interface SerializedAJMeta {
	formatVersion?: string
	rigs?: {
		[key: string]: {
			coreFiles?: string[]
			versionedFiles?: string[]
		}
	}
}

export class ResourcePackAJMeta {
	public coreFiles = new Set<string>()
	public previousCoreFiles = new Set<string>()

	public versionedFiles = new Set<string>()
	public previousVersionedFiles = new Set<string>()

	private previousAJMeta: SerializedAJMeta = {}

	constructor(
		public path: string,
		public exportNamespace: string,
		public lastUsedExportNamespace: string,
		public resourcePackFolder: string
	) {}

	read() {
		if (!fs.existsSync(this.path)) return

		try {
			this.previousAJMeta = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
		} catch (e) {
			throw new IntentionalExportError(`Failed to read existing AJMeta file: ${e}`)
		}

		if (this.previousAJMeta.formatVersion !== '1.0.0') {
			// TODO - Use our new standardized solution to handle file versioning.
			// Assume the file is outdated, and update it.
			const outdated = this.previousAJMeta as OldSerializedAJMeta
			this.previousAJMeta = {
				formatVersion: '1.0.0',
				rigs: {},
			}
			for (const [key, value] of Object.entries(outdated)) {
				this.previousAJMeta.rigs![key] = {
					versionedFiles: value.files,
				}
			}
		}

		this.previousAJMeta.rigs ??= {}

		const lastNamespaceData = this.previousAJMeta.rigs[this.lastUsedExportNamespace]
		if (lastNamespaceData) {
			if (!Array.isArray(lastNamespaceData.versionedFiles))
				lastNamespaceData.versionedFiles = []
			for (const file of lastNamespaceData.versionedFiles) {
				this.previousVersionedFiles.add(PathModule.join(this.resourcePackFolder, file))
			}
			delete this.previousAJMeta.rigs[this.lastUsedExportNamespace]
		}

		const namespaceData = this.previousAJMeta.rigs[this.exportNamespace]
		if (namespaceData) {
			if (!Array.isArray(namespaceData.versionedFiles)) namespaceData.versionedFiles = []
			for (const file of namespaceData.versionedFiles) {
				this.previousVersionedFiles.add(PathModule.join(this.resourcePackFolder, file))
			}
			delete this.previousAJMeta.rigs[this.exportNamespace]
		}
	}

	write() {
		const resourcePackFolder = PathModule.dirname(this.path)
		const content: SerializedAJMeta = {
			formatVersion: '1.0.0',
			rigs: sortObjectKeys({
				...this.previousAJMeta.rigs,
				[this.exportNamespace]: {
					coreFiles: Array.from(this.coreFiles)
						.map(v => normalizePath(PathModule.relative(resourcePackFolder, v)))
						.sort(),
					versionedFiles: Array.from(this.versionedFiles)
						.map(v => normalizePath(PathModule.relative(resourcePackFolder, v)))
						.sort(),
				},
			}),
		}
		fs.writeFileSync(this.path, autoStringify(content))
	}
}
