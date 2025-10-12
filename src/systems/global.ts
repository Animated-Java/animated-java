import { normalizePath } from '../util/fileUtil'
import { IntentionalExportError, IntentionalExportErrorFromInvalidFile } from './exporter'
import { sortObjectKeys } from './util'

export enum SUPPORTED_MINECRAFT_VERSIONS {
	'1.21.9' = '1.21.9',
	'1.21.6' = '1.21.6',
	'1.21.5' = '1.21.5',
	'1.21.4' = '1.21.4',
	'1.21.2' = '1.21.2',
	'1.20.5' = '1.20.5',
	'1.20.4' = '1.20.4',
}

type OldSerializedAJMeta = Record<
	string,
	{
		files?: string[]
	}
>

interface SerializedAJMeta {
	formatVersion?: string
	rigs?: Record<
		string,
		{
			coreFiles?: string[]
			versionedFiles?: string[]
		}
	>
}

export class AJMeta {
	coreFiles = new Set<string>()
	previousCoreFiles = new Set<string>()

	versionedFiles = new Set<string>()
	previousVersionedFiles = new Set<string>()

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
	/** Minecraft enforces this field does not to exist if the pack doesn't support versions older than 1.21.9 */
	formats?: PackMetaFormats
	// Below since 1.21.9
	min_format?: number
	max_format?: number
}
export interface SerializedPackMeta {
	pack?: {
		pack_format?: number
		/** Minecraft enforces this field does not to exist if the pack doesn't support versions older than 1.21.9 */
		supported_formats?: PackMetaFormats[]
		description?: string
		// Below since 1.21.9
		min_format?: number
		max_format?: number
	}
	features?: {
		enabled?: string[]
	}
	filter?: {
		block?: Array<{
			namespace: string
			path: string
		}>
	}
	overlays?: {
		entries?: OverlayEntry[]
	}
	language?: {
		name?: string
		region?: string
		bidirectional?: boolean
	}
}

/**
 * A class that reads and writes pack.mcmeta files.
 *
 * Designed to only modify parts of the file we care about, and leave the rest as-is.
 */
export class PackMeta {
	content: SerializedPackMeta = {}

	static fromFile(path: string) {
		const meta = new PackMeta()

		if (!fs.existsSync(path)) {
			console.warn(`Pack meta file does not exist at ${path}`)
			return meta
		}

		const raw = fs.readFileSync(path, 'utf-8')
		try {
			meta.content = JSON.parse(raw)
		} catch (e: any) {
			throw new IntentionalExportErrorFromInvalidFile(path, e)
		}

		return meta
	}

	toJSON(): SerializedPackMeta {
		return structuredClone(this.content)
	}
}
