import { translate } from './translation'

/**
 * The type of data that can be stored in a setting
 */
export type AnimatedJavaSettingDataType = {
	nbt: string // replace with special NBT type?
	text: string
	number: number
	boolean: boolean
}

/**
 * The visual format used to display the setting's data
 */
export type AnimatedJavaSettingDisplayType = {
	nbt: 'codebox' | 'inline'
	text: 'codebox' | 'inline'
	number: 'int' | 'float'
	boolean: 'checkbox'
}

export type AnimatedJavaSettingOptions<T extends keyof AnimatedJavaSettingDataType> = {
	/**
	 * The ID of the setting, in the format of `namespace:setting_name`
	 */
	id: `${string}:${string}`
	displayName: string
	description: string[]
	dataType: T
	displayType?: AnimatedJavaSettingDisplayType[T]
}

export interface IAnimatedJavaSettingData<T extends keyof AnimatedJavaSettingDataType> {
	value?: AnimatedJavaSettingDataType[T]
	/**
	 * If set will display an error message on the setting.
	 */
	error?: string
	/**
	 * If set will display a warning message on the setting.
	 */
	warning?: string
}

/**
 * Interface used for interacting with an Animated Java setting
 */
export interface IAnimatedJavaSetting<T extends keyof AnimatedJavaSettingDataType> {
	info: AnimatedJavaSettingOptions<T>
	subscribers: Set<Function>
	push: (settingData: IAnimatedJavaSettingData<T>) => void
	pull: () => IAnimatedJavaSettingData<T>
	onUpdate: <V extends IAnimatedJavaSettingData<T>>(settingData: V) => V
	subscribe(callback: (settingData: IAnimatedJavaSettingData<T>) => void): () => void
	dispatchSubscribers: (settingData: IAnimatedJavaSettingData<T>) => void
}

/**
 * Creates a new Animated Java setting
 * @param onUpdate Gets called every time a setting's value is changed in the UI. Lets you modify/verify the value, and show errors/warnings.
 */
export function newSetting<T extends keyof AnimatedJavaSettingDataType>(
	options: AnimatedJavaSettingOptions<T>,
	onUpdate?: <V extends IAnimatedJavaSettingData<T>>(settingData: V) => V
): IAnimatedJavaSetting<T> {
	// TODO put setting init stuff here
	return {
		subscribers: new Set<Function>(),
		info: options,
		push(settingData) {
			this.dispatchSubscribers(settingData)
		},
		pull: () => {
			return {} as IAnimatedJavaSettingData<T>
		},
		onUpdate(settingData) {
			const ret = onUpdate ? onUpdate(settingData) : settingData
			this.dispatchSubscribers(ret)
			return ret
		},
		subscribe(callback) {
			this.subscribers.add(callback)
			return () => this.subscribers.delete(callback)
		},
		dispatchSubscribers(settingData) {
			this.subscribers.forEach(callback => callback(settingData))
		},
	}
}

export const AnimatedJavaSettings = {
	checkbox: newSetting({
		id: 'animatedjava:checkbox',
		displayName: translate('animatedJava.settings.checkbox'),
		description: translate('animatedJava.settings.checkbox.description').split('\n'),
		dataType: 'boolean',
		displayType: 'checkbox',
	}),
	number_int: newSetting({
		id: 'animatedjava:number_int',
		displayName: translate('animatedJava.settings.number_int'),
		description: translate('animatedJava.settings.number_int.description').split('\n'),
		dataType: 'number',
		displayType: 'int',
	}),
	number_float: newSetting({
		id: 'animatedjava:number_float',
		displayName: translate('animatedJava.settings.number_float'),
		description: translate('animatedJava.settings.number_float.description').split('\n'),
		dataType: 'number',
		displayType: 'float',
	}),
	text_inline: newSetting({
		id: 'animatedjava:text_inline',
		displayName: translate('animatedJava.settings.text_inline'),
		description: translate('animatedJava.settings.text_inline.description').split('\n'),
		dataType: 'text',
		displayType: 'inline',
	}),
	text_codebox: newSetting({
		id: 'animatedjava:text_codebox',
		displayName: translate('animatedJava.settings.text_codebox'),
		description: translate('animatedJava.settings.text_codebox.description').split('\n'),
		dataType: 'text',
		displayType: 'codebox',
	}),
}
