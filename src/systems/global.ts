import { getDataPackFormat } from '../util/minecraftUtil'
import { IntentionalExportError } from './exporter'

export type MinecraftVersion = '1.20.4' | '1.20.5' | '1.21.0' | '1.21.2' | '1.21.4' | '1.21.5'

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

		const raw = fs.readFileSync(this.path, 'utf-8')
		try {
			const content = JSON.parse(raw)
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
				`Failed to read existing pack.mcmeta file at ${this.path}: ${e}\n\nFile content:\n${raw}`
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
