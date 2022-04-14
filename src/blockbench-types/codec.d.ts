interface CodecOptions {
	name: string
	load?(model: any, file: object, add?: boolean): void
	compile?(): void
	parse?(): void
	export?(): void
	/**
	 * Generate a file name to suggest when exporting
	 */
	fileName?(): string
	startPath?(): string
	write?(content: any, path: string): void
	afterDownload?(path): void
	afterSave?(path): void

	extension: string
	/**
	 * Whether to remember the models exported using this codec
	 */
	remember: boolean
	load_filter?: {
		extensions: string[]
		type: 'json' | 'text'
		condition?: any
	}
	export_action?: Action
}

declare class Codec extends Deletable {
	constructor(id: string, options: CodecOptions)

	load?(model: any, file: object, add?: boolean): void
	compile?(): any
	parse?(model): void
	export?(): void
	/**
	 * Generate a file name to suggest when exporting
	 */
	fileName?(): string
	startPath?(): string
	write?(content: any, path: string): void
	afterDownload?(path): void
	afterSave?(path): void
	on(event_name: string, callback: (data: object) => void): void
	removeListener(event_name: string, callback: (data: object) => void): void
	dispatchEvent(data: object): void

	name: string
	extension: string
	remember: boolean
	export_action?: Action
	format?: ModelFormat

	static getAllExtensions(): string[]
}

declare const Codecs: {
	[id: string]: Codec
}
