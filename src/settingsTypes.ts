type AnimatedJavaSettingType = {
	nbt: string
	text: string
	number: number
	codebox: string
	checkbox: boolean
}

type AnimatedJavaSettingOptions<T extends keyof AnimatedJavaSettingType> = {
	id: `${string}:${string}`
	displayName: string
	valueType: T
}

interface IAnimatedJavaSettingData<T extends keyof AnimatedJavaSettingType> {
	value?: AnimatedJavaSettingType[T]
	error?: any
	warning?: any
}

function newSetting<T extends keyof AnimatedJavaSettingType>(
	options: AnimatedJavaSettingOptions<T>
): {
	info: AnimatedJavaSettingOptions<T>
	push: (settingData: IAnimatedJavaSettingData<T>) => void
	pull: () => IAnimatedJavaSettingData<T>
} {
	return {
		info: options,
		push: settingData => {},
		pull: () => {
			return {} as IAnimatedJavaSettingData<T>
		},
	}
}

// NOTE: Translation is handled by the exporter using AJ's built-in translate() function, these are just placeholder values.
const ExporterSettings = {
	marker: newSetting({
		id: 'animated_java:marker',
		displayName: 'animated_java.settings.marker.display_name',
		valueType: 'checkbox',
	}),
	superSecret: newSetting({
		id: 'animated_java:superSecret',
		displayName: 'animated_java.settings.superSecret.display_name',
		valueType: 'text',
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
	ExporterSettings.marker.push({ error: 'animated_java.error.generic' })
	ExporterSettings.superSecret.push({ warning: 'animated_java.warning.generic' })
}
