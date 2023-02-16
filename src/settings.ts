import { translate } from './translation'
import { Subscribable } from './util/suscribable'

/**
 * The type of data that can be stored in a setting
 */
export type AnimatedJavaSettingDataType = {
	nbt: string // replace with special NBT type?
	text: string
	number: number
	boolean: boolean
	// record: Record<string, any>
}

/**
 * The visual format used to display the setting's data
 */
export type AnimatedJavaSettingDisplayType = {
	nbt: 'codebox' | 'inline'
	text: 'codebox' | 'inline'
	number: 'int' | 'float'
	boolean: 'checkbox'
	// record: 'dropdown'
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
	defaultValue: AnimatedJavaSettingDataType[T]
	onUpdate?: (settingData: IAnimatedJavaSettingData<T>) => IAnimatedJavaSettingData<T>
}

export interface IAnimatedJavaSettingData<T extends keyof AnimatedJavaSettingDataType>
	extends Object {
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
 * @param onUpdate Gets called every time a setting's value is changed in the UI. Lets you modify/verify the value, and show errors/warnings.
 */
export class AnimatedJavaSetting<T extends keyof AnimatedJavaSettingDataType> extends Subscribable<
	IAnimatedJavaSettingData<T>
> {
	private stored: IAnimatedJavaSettingData<T>
	constructor(public info: AnimatedJavaSettingOptions<T>) {
		super()
		this.stored = {
			value: info.defaultValue,
		}
	}
	push(settingData: IAnimatedJavaSettingData<T>) {
		this.stored = this.info.onUpdate
			? this.info.onUpdate({ value: settingData.value })
			: { ...settingData }
		this.dispatchSubscribers({ ...this.stored })
	}
	pull(): IAnimatedJavaSettingData<T> {
		return { ...this.stored }
	}
}

export const AnimatedJavaSettings = {
	checkbox: new AnimatedJavaSetting({
		id: 'animatedjava:checkbox',
		displayName: translate('animatedJava.settings.checkbox'),
		description: translate('animatedJava.settings.checkbox.description').split('\n'),
		dataType: 'boolean',
		displayType: 'checkbox',
		defaultValue: true,
		onUpdate: settingData => {
			if (settingData.value === false) {
				settingData.warning = translate('animatedJava.settings.checkbox.false_warning')
			}
			return settingData
		},
	}),
	number_int: new AnimatedJavaSetting({
		id: 'animatedjava:number_int',
		displayName: translate('animatedJava.settings.number_int'),
		description: translate('animatedJava.settings.number_int.description').split('\n'),
		dataType: 'number',
		displayType: 'int',
		defaultValue: 42,
		onUpdate: settingData => {
			if (settingData.value && settingData.value < 32) {
				settingData.error = translate('animatedJava.settings.number_int.low_error')
			}
			return settingData
		},
	}),
	number_float: new AnimatedJavaSetting({
		id: 'animatedjava:number_float',
		displayName: translate('animatedJava.settings.number_float'),
		description: translate('animatedJava.settings.number_float.description').split('\n'),
		dataType: 'number',
		displayType: 'float',
		defaultValue: 42.69,
	}),
	text_inline: new AnimatedJavaSetting({
		id: 'animatedjava:text_inline',
		displayName: translate('animatedJava.settings.text_inline'),
		description: translate('animatedJava.settings.text_inline.description').split('\n'),
		dataType: 'text',
		displayType: 'inline',
		defaultValue: 'Hello World!',
	}),
	text_codebox: new AnimatedJavaSetting({
		id: 'animatedjava:text_codebox',
		displayName: translate('animatedJava.settings.text_codebox'),
		description: translate('animatedJava.settings.text_codebox.description').split('\n'),
		dataType: 'text',
		displayType: 'codebox',
		defaultValue: 'Hello World!\nThis is a codebox\nIt can contain multiple lines',
	}),
	// dropdown: new AnimatedJavaSetting({
	// 	id: 'animatedjava:dropdown',
	// 	displayName: translate('animatedJava.settings.dropdown'),
	// 	description: translate('animatedJava.settings.dropdown.description').split('\n'),
	// 	dataType: 'record',
	// 	displayType: 'dropdown',
	// 	defaultValue: { a: 'option1', b: 'option2', c: 'option3' },
	// 	onUpdate: settingData => {
	// 		if (settingData.value && settingData.value === 'option3') {
	// 			settingData.error = translate('animatedJava.settings.dropdown.option3_error')
	// 		}
	// 		return settingData
	// 	},
	// }),
}
