interface IAnimatedJavaExporterOptions {
	id: string
	name: string
	description: string
}

export class _AnimatedJavaExporter {
	static exporters: Record<string, _AnimatedJavaExporter> = {}
	id: string
	name: string
	description: string
	constructor(options: IAnimatedJavaExporterOptions) {
		this.id = options.id
		this.name = options.name
		this.description = options.description
		_AnimatedJavaExporter.exporters[this.id] = this
	}
}
