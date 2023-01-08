type AnimatedJavaSettingDataType = {
	nbt: string // replace with special NBT type?
	text: string
	number: number
	boolean: boolean
}

type AnimatedJavaSettingDisplayType = {
	nbt: 'codebox' | 'inline'
	text: 'codebox' | 'inline'
	number: 'spinner' | 'raw' | 'int' | 'float'
	boolean: 'checkbox'
}

type AnimatedJavaSettingOptions<T extends keyof AnimatedJavaSettingDataType> = {
	id: `${string}:${string}`
	displayName: string
	dataType: T
	displayType?: AnimatedJavaSettingDisplayType[T]
}

interface IAnimatedJavaSettingData<T extends keyof AnimatedJavaSettingDataType> {
	value?: AnimatedJavaSettingDataType[T]
	error?: string
	warning?: string
}

interface IAnimatedJavaSetting<T extends keyof AnimatedJavaSettingDataType> {
	info: AnimatedJavaSettingOptions<T>
	push: (settingData: IAnimatedJavaSettingData<T>) => void
	pull: () => IAnimatedJavaSettingData<T>
	onUpdate: <V extends IAnimatedJavaSettingData<T>>(settingData: V) => V
}

function newSetting<T extends keyof AnimatedJavaSettingDataType>(
	options: AnimatedJavaSettingOptions<T>,
	onUpdate?: <V extends IAnimatedJavaSettingData<T>>(settingData: V) => V
): IAnimatedJavaSetting<T> {
	// Do setting init stuff
	return {
		info: options,
		push: settingData => {
			// Put setting gui update stuff here
			// updateGUI(settingData)
		},
		pull: () => {
			return {} as IAnimatedJavaSettingData<T>
		},
		onUpdate: settingData => {
			const ret = onUpdate ? onUpdate(settingData) : settingData
			// Put setting gui update stuff here
			// updateGUI(ret)
			return ret
		},
	}
}

// NOTE: Translation is handled by the exporter using AJ's built-in translate() function, these are just placeholder values.
const ExporterSettings = {
	marker: newSetting(
		{
			id: 'animated_java:marker',
			displayName: 'animated_java.settings.marker.display_name',
			dataType: 'boolean',
		},
		settingData => {
			return settingData
		}
	),
	superSecret: newSetting(
		{
			id: 'animated_java:superSecret',
			displayName: 'animated_java.settings.superSecret.display_name',
			dataType: 'text',
			displayType: 'inline',
		},
		settingData => {
			if (settingData.value?.includes('goofy')) settingData.warning = 'Your text is too goofy!'
			return settingData
		}
	),
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
