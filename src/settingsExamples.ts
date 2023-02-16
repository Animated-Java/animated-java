import { AnimatedJavaSetting } from './settings'
import { translate } from './translation'

// NOTE: Translation is handled by the exporter using AJ's built-in translate() function, these are just placeholder values.
const ExporterSettings = {
	marker: new AnimatedJavaSetting({
		id: 'animatedJava:marker',
		displayName: translate('animatedJava.settings.marker.display_name'),
		description: translate('animatedJava.settings.marker.description').split('\n'),
		dataType: 'boolean',
		displayType: 'checkbox',
		defaultValue: false,
		onUpdate: settingData => {
			return settingData
		},
	}),
	superSecret: new AnimatedJavaSetting({
		id: 'animatedJava:superSecret',
		displayName: translate('animatedJava.settings.superSecret.display_name'),
		description: translate('animatedJava.settings.superSecret.description').split('\n'),
		dataType: 'text',
		displayType: 'inline',
		defaultValue: 'Silly setting',
		onUpdate: settingData => {
			if (settingData.value?.toLowerCase().includes('goofy'))
				settingData.warning = 'Your text is too goofy!'
			return settingData
		},
	}),
}

{
	// Get setting
	const markerData = ExporterSettings.marker.pull()
	console.log(markerData.value) // boolean
	const superSecretdata = ExporterSettings.superSecret.pull()
	console.log(superSecretdata.value) // string

	// Set setting value
	ExporterSettings.marker.push({ value: true })
	ExporterSettings.superSecret.push({ value: 'Goofy ahh setting' })

	// Set setting error/warning.
	// Note that the value doesn't need to be included, if it's ommitted it doesn't effect the setting's value.
	ExporterSettings.marker.push({ error: 'animatedJava.error.generic' })
	ExporterSettings.superSecret.push({ warning: 'animatedJava.warning.generic' })
}
