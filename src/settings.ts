import { _AnimatedJavaExporter } from './exporter'
import { translate } from './translation'
import { defer } from './util'
import { Subscribable } from './util/suscribable'

export interface IAJSettingData<V> extends Object {
	value?: V
	warning?: string
	error?: string
}

interface IAJSettingOptions<V> {
	id: `${string}:${string}`
	displayName: string
	description: string[]
	defaultValue: V
}

export class AJSetting<V> extends Subscribable<IAJSettingData<V>> {
	id: `${string}:${string}`
	displayName: string
	description: string[]
	defaultValue: V
	onUpdate?: (setting: this) => void
	onInit?: (setting: this) => void
	_value: V
	_warning?: string
	_error?: string
	export: boolean = true

	constructor(options: IAJSettingOptions<V>) {
		super()
		this.id = options.id
		this.displayName = options.displayName
		this.description = options.description
		this.defaultValue = options.defaultValue

		this._value = this.defaultValue
	}

	get value() {
		return this._value
	}

	set value(value: V) {
		this._value = value
		defer(() => this.dispatchSubscribers({ value }))
	}

	get warning() {
		return this._warning
	}

	set warning(str: string | undefined) {
		this._warning = str
		defer(() => this.dispatchSubscribers({ warning: str }))
	}

	get error() {
		return this._error
	}

	set error(str: string | undefined) {
		this.error = str
		defer(() => this.dispatchSubscribers({ error: str }))
	}

	_onInit() {
		if (this.onInit) this.onInit(this)
	}

	_onUpdate() {
		if (this.onUpdate) this.onUpdate(this)
	}

	toJSON() {
		return {
			value: this.value,
			warning: this.warning,
			error: this.error,
		}
	}
}

export class AJCheckboxSetting extends AJSetting<boolean> {
	constructor(
		options: IAJSettingOptions<boolean>,
		public onUpdate?: (setting: AJCheckboxSetting) => void,
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
		public onUpdate?: (setting: AJNumberSetting) => void,
		public onInit?: (setting: AJNumberSetting) => void
	) {
		super(options)
		this.min = options.min
		this.max = options.max
		this.step = options.step
		this.snap = options.snap
	}

	_onUpdate() {
		if (isNaN(this._value)) this._value = this.defaultValue
		if (this.snap) this._value = Math.round(this._value / this.snap) * this.snap
		this._value = Math.min(Math.max(this._value, this.min ?? -Infinity), this.max ?? Infinity)

		super._onUpdate()
	}
}

export class AJInlineTextSetting extends AJSetting<string> {
	constructor(
		options: IAJSettingOptions<string>,
		public onUpdate?: (setting: AJInlineTextSetting) => void,
		public onInit?: (setting: AJInlineTextSetting) => void
	) {
		super(options)
	}
}

export class AJCodeboxSetting extends AJSetting<string> {
	constructor(
		options: IAJSettingOptions<string>,
		public onUpdate?: (setting: AJCodeboxSetting) => void,
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
export class AJDropdownSetting<V extends any> extends AJSetting<number> {
	options: IAJDropdownOption<V>[]
	constructor(
		options: IAJDropdownSettingOptions<V>,
		public onUpdate?: (options: AJDropdownSetting<V>) => void,
		public onInit?: (options: AJDropdownSetting<V>) => void
	) {
		super(options as IAJSettingOptions<number>)
		this.options = options.options
	}

	get selected(): V {
		return this.options[this._value]?.value
	}

	_onUpdate() {
		if (!this.options.at(this._value)) {
			if (this._value === this.defaultValue)
				throw new Error(
					`Invalid default index for option setting ${this.id}: ${this._value}`
				)
			this._value = this.defaultValue
		}
		super._onUpdate()
	}
}

export class AJFolderSetting extends AJSetting<string> {
	constructor(
		options: IAJSettingOptions<string>,
		public onUpdate?: (setting: AJFolderSetting) => void,
		public onInit?: (setting: AJFolderSetting) => void
	) {
		super(options)
	}
}

export class AJMetaSetting extends AJSetting<null> {
	export: boolean = false
	constructor(
		options: IAJSettingOptions<null>,
		public onUpdate?: (setting: AJTitleSetting) => void,
		public onInit?: (setting: AJTitleSetting) => void
	) {
		super(options)
	}
}

export class AJTitleSetting extends AJMetaSetting {}

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
		function onUpdate(setting) {
			console.log(setting.selected)
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
