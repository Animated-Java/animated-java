import { loadExporter } from './datapackExporter'

declare global {
	// I am not sure if this is the best way to do this, but it works 🤓👍
	type ExporterSettings = ReturnType<ReturnType<typeof loadExporter>['getSettings']>
	type ExportData = AnimatedJava.IAnimatedJavaExportData<ExporterSettings>
}
