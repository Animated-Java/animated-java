import { _AnimatedJavaExporter } from './exporter'
import { translate } from './util/translation'
import { GUIStructure } from './ui/ajUIStructure'
import { Subscribable } from './util/suscribable'

export interface IInfoPopup {
	type: 'warning' | 'error' | 'info'
	title: string
	lines: string[]
}

export interface ISettingOptions<V> {
	id: string
	displayName: string
	description: string[]
	defaultValue: V
	resettable?: boolean
	docsLink?: string
}

export class Setting<V, R = any> extends Subscribable<R> {
	id: string
	displayName: string
	description: string[]
	defaultValue: V
	resettable?: boolean
	docsLink?: string

	protected _value: V
	private lastValue: V
	infoPopup?: IInfoPopup
	constructor(
		options: ISettingOptions<V>,
		public onUpdate?: (setting: R) => void,
		public onInit?: (setting: R) => void
	) {
		super()
		this.id = options.id
		this.displayName = options.displayName
		this.description = options.description
		this.defaultValue = options.defaultValue
		this.resettable = options.resettable
		this.docsLink = options.docsLink

		this._value = this.defaultValue
		this.lastValue = this.defaultValue
	}

	get value(): V {
		return this._value
	}

	set value(value: V) {
		this._value = value
		this._onUpdate()
	}

	_onInit() {
		if (this.onInit) this.onInit(this as unknown as R)
	}

	_onUpdate() {
		if (this.lastValue === this.value) return
		this.lastValue = this.value
		this.infoPopup = undefined
		if (this.onUpdate) this.onUpdate(this as unknown as R)
		this.dispatch(this as unknown as R)
	}

	toJSON() {
		return {
			value: this.value,
		}
	}
}

export class CheckboxSetting extends Setting<boolean, CheckboxSetting> {}
export class InlineTextSetting extends Setting<string, InlineTextSetting> {}
export class CodeboxSetting extends Setting<string, CodeboxSetting> {}
export class FolderSetting extends Setting<string, FolderSetting> {}
export class FileSetting extends Setting<string, FileSetting> {}

export class NumberSetting extends Setting<number, NumberSetting> {
	min?: number
	max?: number
	step?: number
	snap?: boolean
	constructor(
		options: ISettingOptions<number> & {
			min?: number
			max?: number
			step?: number
			snap?: boolean
		},
		onUpdate?: (setting: NumberSetting) => void,
		onInit?: (setting: NumberSetting) => void
	) {
		super(options, onUpdate, onInit)
		this.min = options.min
		this.max = options.max
		this.step = options.step
		this.snap = options.snap
	}

	_onUpdate() {
		if (isNaN(this._value)) this._value = this.defaultValue
		if (this.step && this.snap) this._value = Math.round(this._value / this.step) * this.step
		this._value = Math.min(Math.max(this._value, this.min ?? -Infinity), this.max ?? Infinity)
		super._onUpdate()
	}
}

export class DropdownSetting<V = any, K extends number = number> extends Setting<
	K,
	DropdownSetting<V, K>
> {
	options: { name: string; value: V }[]
	constructor(
		options: ISettingOptions<K> & { options: DropdownSetting<V, K>['options'] },
		public onUpdate?: (setting: DropdownSetting<V, K>) => void,
		public onInit?: (setting: DropdownSetting<V, K>) => void
	) {
		super(options, onUpdate, onInit)
		this.options = options.options
	}

	get selected(): DropdownSetting<V, K>['options'][any] | undefined {
		return this.options[this.value]
	}
}

export class ImageDropdownSetting extends DropdownSetting<Texture['uuid']> {
	constructor(
		options: ISettingOptions<number> & { options: ImageDropdownSetting['options'] },
		onUpdate?: (setting: ImageDropdownSetting) => void,
		onInit?: (setting: ImageDropdownSetting) => void
	) {
		super(options, onUpdate as any, onInit as any)
	}

	getSelectedTexture() {
		return Texture.all.find(texture => texture.uuid === this.selected?.value)
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
		function onUpdate(settingData) {
			console.log(settingData.selected)
			return settingData
		},
		function onInit(setting) {
			setting.options = AnimatedJavaExporter.all.map(exporter => ({
				name: exporter.name,
				value: exporter.id,
			}))
		}
	),
}

export const AnimatedJavaSettingsStructure: GUIStructure = [
	{
		type: 'setting',
		id: AnimatedJavaSettings.default_exporter.id,
	},
]
