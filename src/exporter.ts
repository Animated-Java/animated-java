import { Setting as AJSetting } from './settings'

interface IAnimatedJavaExporterOptions {
	id: string
	name: string
	description: string
	settings: Record<string, AJSetting<any>>
}

export class _AnimatedJavaExporter {
	static exporters: Record<string, _AnimatedJavaExporter> = {}
	id: string
	name: string
	description: string
	settings: Record<string, AJSetting<any>>
	constructor(options: IAnimatedJavaExporterOptions) {
		this.id = options.id
		this.name = options.name
		this.description = options.description
		this.settings = options.settings
		_AnimatedJavaExporter.exporters[this.id] = this
	}
}
