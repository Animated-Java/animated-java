import { _AnimatedJavaExporter } from './exporter'
import { translate } from './translation'
import { Subscribable } from './util/suscribable'

export interface IAJSettingData<V> extends Object {
	value: V
	warnings: IAJSettingWarning[]
	errors: IAJSettingError[]
}

interface IAJSettingOptions<V> {
	id: `${string}:${string}`
	displayName: string
	description: string[]
	defaultValue: V
	resettable?: boolean
}

export interface IAJSettingWarning {
	title: string
	lines: string[]
}

export interface IAJSettingError {
	title: string
	lines: string[]
}

export class AJSetting<V> extends Subscribable<IAJSettingData<V>> {
	id: `${string}:${string}`
	displayName: string
	description: string[]
	defaultValue: V
	resettable?: boolean
	onUpdate?: (settingData: IAJSettingData<V>) => IAJSettingData<V>
	onInit?: (setting: this) => void
	value: V
	warnings: IAJSettingWarning[]
	errors: IAJSettingWarning[]
	export: boolean = true

	constructor(options: IAJSettingOptions<V>) {
		super()
		this.id = options.id
		this.displayName = options.displayName
		this.description = options.description
		this.defaultValue = options.defaultValue
		this.resettable = options.resettable

		this.value = this.defaultValue
		this.warnings = []
		this.errors = []
	}

	push(value: V) {
		this.value = value
		this._onUpdate()
	}

	_onInit() {
		if (this.onInit) this.onInit(this)
	}

	_onUpdate() {
		this.errors = []
		this.warnings = []
		if (this.onUpdate) this.onUpdate(this.toJSON())
		this.dispatchSubscribers(this.toJSON())
		console.log(`Setting ${this.displayName} updated:`, this.toJSON())
	}

	toJSON(): IAJSettingData<V> {
		return {
			value: this.value,
			warnings: this.warnings,
			errors: this.errors,
		}
	}
}

export class AJCheckboxSetting extends AJSetting<boolean> {
	constructor(
		options: IAJSettingOptions<boolean>,
		public onUpdate?: (settingData: IAJSettingData<boolean>) => IAJSettingData<boolean>,
		public onInit?: (setting: AJCheckboxSetting) => void
	) {
		super(options)
	}
}

interface IAJNumberSettingOptions extends IAJSettingOptions<number> {
	min?: number
	max?: number
	step?: number
	snap?: number
}

export class AJNumberSetting extends AJSetting<number> {
	min?: number
	max?: number
	step?: number
	snap?: number
	constructor(
		options: IAJNumberSettingOptions,
		public onUpdate?: (settingData: IAJSettingData<number>) => IAJSettingData<number>,
		public onInit?: (setting: AJNumberSetting) => void
	) {
		super(options)
		this.min = options.min
		this.max = options.max
		this.step = options.step
		this.snap = options.snap
	}

	_onUpdate() {
		if (isNaN(this.value)) this.value = this.defaultValue
		if (this.snap) this.value = Math.round(this.value / this.snap) * this.snap
		this.value = Math.min(Math.max(this.value, this.min ?? -Infinity), this.max ?? Infinity)

		super._onUpdate()
	}
}

export class AJInlineTextSetting extends AJSetting<string> {
	constructor(
		options: IAJSettingOptions<string>,
		public onUpdate?: (settingData: IAJSettingData<string>) => IAJSettingData<string>,
		public onInit?: (setting: AJInlineTextSetting) => void
	) {
		super(options)
	}
}

export class AJCodeboxSetting extends AJSetting<string> {
	constructor(
		options: IAJSettingOptions<string>,
		public onUpdate?: (settingData: IAJSettingData<string>) => IAJSettingData<string>,
		public onInit?: (setting: AJCodeboxSetting) => void
	) {
		super(options)
	}
}

interface IAJDropdownOption<V> {
	displayName: string
	description: string[]
	value: V
}
interface IAJDropdownSettingOptions<V> extends IAJSettingOptions<number> {
	options: IAJDropdownOption<V>[]
}
interface IAJDropdownSettingData<V> extends IAJSettingData<number> {
	selected?: V
}
export class AJDropdownSetting<V extends any> extends AJSetting<number> {
	options: IAJDropdownOption<V>[]
	constructor(
		options: IAJDropdownSettingOptions<V>,
		public onUpdate?: (settingData: IAJDropdownSettingData<V>) => IAJDropdownSettingData<V>,
		public onInit?: (setting: AJDropdownSetting<V>) => void
	) {
		super(options as IAJSettingOptions<number>)
		this.options = options.options
	}

	get selected(): V {
		return this.options[this.value]?.value
	}

	_onUpdate() {
		if (!this.options.at(this.value)) {
			if (this.value === this.defaultValue)
				throw new Error(
					`Invalid default index for option setting ${this.id}: ${this.value}`
				)
			this.value = this.defaultValue
		}
		super._onUpdate()
	}
}

export class AJFolderSetting extends AJSetting<string> {
	constructor(
		options: IAJSettingOptions<string>,
		public onUpdate?: (settingData: IAJSettingData<string>) => IAJSettingData<string>,
		public onInit?: (setting: AJFolderSetting) => void
	) {
		super(options)
	}
}

export let AnimatedJavaSettings = {
	default_exporter: new AJDropdownSetting<string>(
		{
			id: 'animated_java:default_exporter',
			displayName: translate('animated_java.settings.default_exporter'),
			description: translate('animated_java.settings.default_exporter.description').split(
				'\n'
			),
			defaultValue: 0,
			options: [],
		},
		function onUpdate(settingData) {
			console.log(settingData.selected)
			return settingData
		},
		function onInit(setting) {
			setting.options = Object.values(AnimatedJavaExporter.exporters).map(exporter => ({
				displayName: exporter.name,
				description: exporter.description.split('\n'),
				value: exporter.id,
			}))
		}
	),
}
