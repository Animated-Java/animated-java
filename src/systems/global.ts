import { normalizePath } from '../util/fileUtil'
import { getDataPackFormat } from '../util/minecraftUtil'
import { IntentionalExportError } from './exporter'
import { sortObjectKeys } from './util'

export type MinecraftVersion = '1.20.4' | '1.20.5' | '1.21.0' | '1.21.2' | '1.21.4' | '1.21.5'

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

export class AJMeta {
	public coreFiles = new Set<string>()
	public previousCoreFiles = new Set<string>()

	public versionedFiles = new Set<string>()
	public previousVersionedFiles = new Set<string>()

	private previousAJMeta: SerializedAJMeta = {}

	constructor(
		public path: string,
		public exportNamespace: string,
		public lastUsedExportNamespace: string,
		public rootFolder: string
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
				this.previousVersionedFiles.add(PathModule.join(this.rootFolder, file))
			}
			delete this.previousAJMeta.rigs[this.lastUsedExportNamespace]
		}

		const namespaceData = this.previousAJMeta.rigs[this.exportNamespace]
		if (namespaceData) {
			if (!Array.isArray(namespaceData.versionedFiles)) namespaceData.versionedFiles = []
			for (const file of namespaceData.versionedFiles) {
				this.previousVersionedFiles.add(PathModule.join(this.rootFolder, file))
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

export type PackMetaFormats = number | number[] | { min_inclusive: number; max_inclusive: number }

interface OverlayEntry {
	directory?: string
	formats?: PackMetaFormats
}
export interface SerializedPackMeta {
	pack?: {
		pack_format?: number
		supported_formats?: PackMetaFormats[]
		description?: string
	}
	overlays?: {
		entries?: Array<OverlayEntry>
	}
}

export class PackMeta {
	constructor(
		public path: string,
		public pack_format = getDataPackFormat('1.20.4'),
		public supportedFormats: PackMetaFormats[] = [],
		public description = 'Animated Java Resource Pack',
		public overlayEntries = new Set<OverlayEntry>()
	) {}

	read() {
		if (!fs.existsSync(this.path)) return

		try {
			const content = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
			if (content.pack) {
				this.pack_format = content.pack.pack_format ?? this.pack_format
				this.description = content.pack.description ?? this.description
				this.supportedFormats = content.pack.supported_formats ?? this.supportedFormats
			}
			if (content.overlays) {
				for (const entry of content.overlays.entries ?? []) {
					this.overlayEntries.add(entry)
				}
			}
		} catch (e) {
			throw new IntentionalExportError(
				`Failed to read existing Data Pack's pack.mcmeta file: ${e}`
			)
		}
	}

	toJSON(): SerializedPackMeta {
		const json: SerializedPackMeta = {
			pack: {
				pack_format: this.pack_format,
				supported_formats:
					this.supportedFormats.length > 0 ? this.supportedFormats : undefined,
				description: this.description,
			},
		}
		if (this.overlayEntries.size > 0) {
			json.overlays = {
				entries: Array.from(this.overlayEntries),
			}
		}
		return json
	}
}
