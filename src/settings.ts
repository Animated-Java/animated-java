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
	number: 'spinner' | 'raw' | 'int' | 'float'
	boolean: 'checkbox'
}

export type AnimatedJavaSettingOptions<T extends keyof AnimatedJavaSettingDataType> = {
	/**
	 * The ID of the setting, in the format of `namespace:setting_name`
	 */
	id: `${string}:${string}`
	displayName: string
	description: string
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
	foo: newSetting({
		id: 'animatedjava:foo',
		displayName: translate('settings.foo'),
		description: translate('settings.foo.description'),
		dataType: 'boolean',
		displayType: 'checkbox',
	}),
	bar: newSetting({
		id: 'animatedjava:bar',
		displayName: translate('settings.bar'),
		description: translate('settings.bar.description'),
		dataType: 'boolean',
		displayType: 'checkbox',
	}),
	baz: newSetting({
		id: 'animatedjava:baz',
		displayName: translate('settings.baz'),
		description: translate('settings.baz.description'),
		dataType: 'boolean',
		displayType: 'checkbox',
	}),
	qux: newSetting({
		id: 'animatedjava:qux',
		displayName: translate('settings.qux'),
		description: translate('settings.qux.description'),
		dataType: 'boolean',
		displayType: 'checkbox',
	}),
	quux: newSetting({
		id: 'animatedjava:quux',
		displayName: translate('settings.quux'),
		description: translate('settings.quux.description'),
		dataType: 'boolean',
		displayType: 'checkbox',
	}),
}
