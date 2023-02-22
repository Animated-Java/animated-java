import { translate } from '../../translation'

const statueExporter = new AnimatedJavaExporter({
	id: 'animated_java:statue_exporter',
	name: translate('animated_java.exporters.statue_exporter.name'),
	description: translate('animated_java.exporters.statue_exporter.description'),
	settings: {
		foo: new AnimatedJavaSettings.CheckboxSetting({
			id: 'animated_java:statue_exporter:foo',
			displayName: translate('animated_java.exporters.statue_exporter.settings.foo'),
			description: translate(
				'animated_java.exporters.statue_exporter.settings.foo.description'
			).split('\n'),
			defaultValue: false,
		}),
	},
})

export {}
