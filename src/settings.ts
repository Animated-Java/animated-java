import { translate } from './translation'
import { Subscribable } from './util/suscribable'

export interface ISettingData<ValueType> extends Object {
	value?: ValueType
	warning?: string
	error?: string
}

interface IOnUpdateSettingData<ValueType> extends ISettingData<ValueType> {
	value: ValueType
}

export interface ISettingOptions<ValueType, DisplayType> {
	id: `${string}:${string}`
	displayName: string
	description: string[]
	defaultValue: ValueType
	displayType: DisplayType
	onUpdate?: (settingData: IOnUpdateSettingData<ValueType>) => ISettingData<ValueType>
}

export class Setting<ValueType, DisplayType> extends Subscribable<ISettingData<ValueType>> {
	private stored: ISettingData<ValueType>
	onUpdate?: ISettingOptions<ValueType, DisplayType>['onUpdate']
	constructor(public info: ISettingOptions<ValueType, DisplayType>) {
		super()
		this.stored = {
			value: info.defaultValue,
		}
		this.onUpdate = info.onUpdate
		if (this.onUpdate) {
			this.stored = this.onUpdate({ value: this.stored.value! })
		}
	}
	push(settingData: ISettingData<ValueType>) {
		this.stored = this.onUpdate
			? this.onUpdate({ value: settingData.value! })
			: { ...settingData }
		this.dispatchSubscribers({ ...this.stored })
	}
	pull(): ISettingData<ValueType> {
		return { ...this.stored }
	}
	toJSON() {
		return this.stored
	}
}

export class BooleanSetting<DisplayType extends 'checkbox'> extends Setting<boolean, DisplayType> {
	constructor(info: ISettingOptions<boolean, DisplayType>) {
		super(info)
	}
}

export class NumberSetting<DisplayType extends 'int' | 'float'> extends Setting<
	number,
	DisplayType
> {
	constructor(info: ISettingOptions<number, DisplayType>) {
		super(info)
	}
}

export class TextSetting<DisplayType extends 'codebox' | 'inline'> extends Setting<
	string,
	DisplayType
> {
	constructor(info: ISettingOptions<string, DisplayType>) {
		super(info)
	}
}

interface IDropDownSettingOptions<ValueType, DisplayType>
	extends ISettingOptions<string, DisplayType> {
	options: Record<string, ValueType>
}

export class RecordSetting<ValueType, DisplayType extends 'dropdown'> extends Setting<
	string,
	DisplayType
> {
	options: Record<string, ValueType>
	constructor(info: IDropDownSettingOptions<ValueType, DisplayType>) {
		super(info)
		this.options = info.options
		this.onUpdate = settingData => {
			if (!(settingData.value && settingData.value in this.options)) {
				settingData.value = info.defaultValue
			}
			return this.info.onUpdate ? this.info.onUpdate(settingData) : settingData
		}
	}
}

export type SettingObject = Record<string, Setting<any, any>>

export let AnimatedJavaSettings: SettingObject = {
	default_exporter: new RecordSetting({
		id: 'animated_java:default_exporter',
		displayName: translate('animated_java.settings.default_exporter'),
		description: translate('animated_java.settings.default_exporter.description').split('\n'),
		displayType: 'dropdown',
		defaultValue: 'animated_java:animation_exporter',
		options: {
			'animated_java:statue_exporter': translate(
				'animated_java.exporters.statue_exporter.display_name'
			),
			'animated_java:animation_exporter': translate(
				'animated_java.exporters.animation_exporter.display_name'
			),
		},
	}),
}

export let TestSettings = {
	checkbox: new BooleanSetting({
		id: 'animated_java:checkbox',
		displayName: translate('animated_java.settings.checkbox'),
		description: translate('animated_java.settings.checkbox.description').split('\n'),
		displayType: 'checkbox',
		defaultValue: true,
		onUpdate: settingData => {
			if (settingData.value === false) {
				settingData.error = translate('animated_java.settings.checkbox.false_error')
			}
			return settingData
		},
	}),
	number_int: new NumberSetting({
		id: 'animated_java:number_int',
		displayName: translate('animated_java.settings.number_int'),
		description: translate('animated_java.settings.number_int.description').split('\n'),
		displayType: 'int',
		defaultValue: 32,
		onUpdate: settingData => {
			if (settingData.value < 32) {
				settingData.warning = translate('animated_java.settings.number_int.low_error')
			}
			return settingData
		},
	}),
	number_float: new NumberSetting({
		id: 'animated_java:number_float',
		displayName: translate('animated_java.settings.number_float'),
		description: translate('animated_java.settings.number_float.description').split('\n'),
		displayType: 'float',
		defaultValue: 32.32,
	}),
	text_inline: new TextSetting({
		id: 'animated_java:text_inline',
		displayName: translate('animated_java.settings.text_inline'),
		description: translate('animated_java.settings.text_inline.description').split('\n'),
		displayType: 'inline',
		defaultValue: 'Hello World!',
	}),
	text_codebox: new TextSetting({
		id: 'animated_java:text_codebox',
		displayName: translate('animated_java.settings.text_codebox'),
		description: translate('animated_java.settings.text_codebox.description').split('\n'),
		displayType: 'codebox',
		defaultValue: 'Hello World!\nThis is a codebox\nIt can contain multiple lines',
	}),
	dropdown: new RecordSetting({
		id: 'animated_java:dropdown',
		displayName: translate('animated_java.settings.dropdown'),
		description: translate('animated_java.settings.dropdown.description').split('\n'),
		displayType: 'dropdown',
		defaultValue: 'option1',
		options: {
			option1: 'Option 1',
			option2: 'Option 2',
			option3: 'Option 3',
		},
		onUpdate: settingData => {
			if (settingData.value === 'option3') {
				settingData.warning = translate('animated_java.settings.dropdown.option3_error')
			}
			return settingData
		},
	}),
}
