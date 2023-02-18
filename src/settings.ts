import { _AnimatedJavaExporter } from './exporter'
import { translate } from './translation'
import { defer } from './util'
import { Subscribable } from './util/suscribable'

export interface ISettingData<V> extends Object {
	value?: V
	warning?: string
	error?: string
}

interface ISettingOptions<V> {
	id: `${string}:${string}`
	displayName: string
	description: string[]
	defaultValue: V
}

export class Setting<V> extends Subscribable<ISettingData<V>> {
	id: `${string}:${string}`
	displayName: string
	description: string[]
	defaultValue: V
	onUpdate?: (setting: this) => void
	onInit?: (setting: this) => void
	_value: V
	_warning?: string
	_error?: string

	constructor(options: ISettingOptions<V>) {
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

export class CheckboxSetting extends Setting<boolean> {
	constructor(
		options: ISettingOptions<boolean>,
		public onUpdate?: (setting: CheckboxSetting) => void,
		public onInit?: (setting: CheckboxSetting) => void
	) {
		super(options)
	}
}

interface INumberSettingOptions extends ISettingOptions<number> {
	min?: number
	max?: number
	step?: number
	snap?: number
}

export class NumberSetting extends Setting<number> {
	min?: number
	max?: number
	step?: number
	snap?: number
	constructor(
		options: INumberSettingOptions,
		public onUpdate?: (setting: NumberSetting) => void,
		public onInit?: (setting: NumberSetting) => void
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

export class InlineTextSetting extends Setting<string> {
	constructor(
		options: ISettingOptions<string>,
		public onUpdate?: (setting: InlineTextSetting) => void,
		public onInit?: (setting: InlineTextSetting) => void
	) {
		super(options)
	}
}

export class CodeboxSetting extends Setting<string> {
	constructor(
		options: ISettingOptions<string>,
		public onUpdate?: (setting: CodeboxSetting) => void,
		public onInit?: (setting: CodeboxSetting) => void
	) {
		super(options)
	}
}

interface IDropdownOption<V> {
	displayName: string
	description: string[]
	value: V
}
interface IDropdownSettingOptions<V> extends ISettingOptions<number> {
	options: IDropdownOption<V>[]
}
export class DropdownSetting<V extends any> extends Setting<number> {
	options: IDropdownOption<V>[]
	constructor(
		options: IDropdownSettingOptions<V>,
		public onUpdate?: (options: DropdownSetting<V>) => void,
		public onInit?: (options: DropdownSetting<V>) => void
	) {
		super(options as ISettingOptions<number>)
		this.options = options.options
	}

	get selected(): V {
		console.log(this.options, this.options[this._value], this._value)
		return this.options[this._value].value
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

export let AnimatedJavaSettings = {
	default_exporter: new DropdownSetting<string>(
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
