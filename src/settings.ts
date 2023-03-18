import { GUIStructure } from './GUIStructure'
import { formatStr } from './util/misc'
import { Subscribable } from './util/subscribable'
import { translate } from './util/translation'
import * as events from './events'
import { reducedMotion } from './ui/util/accessability'

export interface IInfoPopup {
	type: 'warning' | 'error' | 'info'
	title: string
	lines: string[]
}

export type SettingID = `${string}${string}:${string}${string}/${string}${string}`

export interface ISettingOptions<V> {
	/**
	 * The id of the setting.
	 * The id should be in the format of `namespace:interface/setting_name`.
	 * This should be unique across all plugins and interfaces!
	 */
	id: SettingID
	displayName: string
	/**
	 * A list of paragraphs to display in the description of the setting.
	 */
	description: string[]
	/**
	 * The default value of the setting.
	 */
	defaultValue: V
	/**
	 * Whether or not the setting can be reset to its default value.
	 */
	resettable?: boolean
	/**
	 * A link to the docs page/section for this setting.
	 */
	docsLink?: string
	/**
	 * A list of settings that this setting depends on.
	 * If any of the settings in this list update, this setting will also update.
	 */
	dependsOn?: SettingID[]
}

export type ISettingsObject = Record<string, Setting<any>>

export class Setting<V, R = any> extends Subscribable<R> {
	static registeredSettings = new Map<string, Setting<any>>()

	id: SettingID
	displayName: string
	description: string[]
	defaultValue: V
	resettable?: boolean
	docsLink?: string
	dependsOn?: SettingID[]

	private _initialized: boolean
	protected _value: V
	protected lastValue: V
	infoPopup?: IInfoPopup
	/**
	 * Creates a new setting
	 * @param onUpdate runs when the setting's value is updated.
	 * @param onInit runs when the setting is initialized.
	 */
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
		this.dependsOn = options.dependsOn

		this._value = this.defaultValue
		this.lastValue = this.defaultValue
		this._initialized = false

		Setting.registeredSettings.set(this.id, this)
	}

	get value(): V {
		return this._value
	}

	set value(value: V) {
		this._value = value
		this._onUpdate()
	}

	_onInit() {
		if (this._initialized) return
		console.log('Initializing setting', this.id)
		if (this.onInit) this.onInit(this as unknown as R)

		if (this.dependsOn) {
			for (const id of this.dependsOn) {
				const setting = Setting.registeredSettings.get(id)
				if (!setting) {
					console.warn(
						`Setting ${this.id} depends on setting ${id}, but that setting does not exist.`
					)
					continue
				}
				setting.subscribe(() => {
					this._onUpdate(true)
				})
			}
		}

		this._initialized = true
	}

	_onUpdate(forced = false) {
		if (!forced && this.lastValue === this.value) return
		// console.log('Updating setting', this.id, forced)
		this.lastValue = this.value
		this.infoPopup = undefined
		if (this.onUpdate) this.onUpdate(this as unknown as R)
		this.dispatch(this as unknown as R)
	}

	verify() {
		if (this.onUpdate) this.onUpdate(this as unknown as R)
		return this.infoPopup
	}

	_save(): any {
		return this.value
	}

	_load(value: any) {
		this.value = value
	}
}

export class CheckboxSetting extends Setting<boolean, CheckboxSetting> {}
export class InlineTextSetting extends Setting<string, InlineTextSetting> {}
export class CodeboxSetting extends Setting<string, CodeboxSetting> {
	language: string
	constructor(
		options: ISettingOptions<string> & { language: string },
		onUpdate?: (setting: CodeboxSetting) => void,
		onInit?: (setting: CodeboxSetting) => void
	) {
		super(options, onUpdate, onInit)
		this.language = options.language
	}
}

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
	options: Array<{ name: string; value: V }>
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

	override _save() {
		return this.selected?.value
	}

	override _load(value: any) {
		const index = this.options.findIndex(option => option.value === value) as K
		this.value = index >= 0 ? index : this.defaultValue
	}
}

export class ImageDropdownSetting extends DropdownSetting<Texture['uuid']> {
	constructor(
		options: ISettingOptions<number> & { options: ImageDropdownSetting['options'] },
		onUpdate?: (setting: ImageDropdownSetting) => void,
		onInit?: (setting: ImageDropdownSetting) => void
	) {
		super(
			options,
			onUpdate as Setting<Texture['uuid']>['onUpdate'],
			onInit as Setting<Texture['uuid']>['onInit']
		)
	}

	getSelectedTexture() {
		return Texture.all.find(texture => texture.uuid === this.selected?.value)
	}
}

export interface IListItem {
	name: string
	value: string
}
export class ListBuilderSetting extends Setting<IListItem[]> {
	options: IListItem[]
	addNewItemMessage: string
	constructor(
		options: ISettingOptions<IListItem[]> & {
			options: ListBuilderSetting['options']
			addNewItemMessage: string
		},
		onUpdate?: (setting: ListBuilderSetting) => void,
		onInit?: (setting: ListBuilderSetting) => void
	) {
		super(options, onUpdate as Setting<string>['onUpdate'], onInit as Setting<string>['onInit'])
		this.options = options.options
		this.addNewItemMessage = options.addNewItemMessage
	}

	hasItem(item: IListItem) {
		return this.value.some(i => i.value === item.value && i.name === item.name)
	}

	removeItem(item: IListItem) {
		this.value = this.value.filter(i => i.value !== item.value && i.name !== item.name)
		this._onUpdate(true)
	}

	addItem(item: IListItem, forced = false) {
		if (!forced && this.hasItem(item)) return
		this.value.push(item)
		this._onUpdate(true)
	}

	override _save(): any {
		return this.value
	}

	override _load(value: IListItem[]) {
		this.value = []
		for (const item of value) {
			this.addItem(item, true)
		}
	}
}

export const animatedJavaSettings = {
	reduced_motion: new CheckboxSetting(
		{
			id: 'animated_java:global_settings/reduced_motion',
			displayName: translate('animated_java.settings.reduced_motion'),
			description: translate('animated_java.settings.reduced_motion.description').split('\n'),
			defaultValue: false,
		},
		function onUpdate(setting) {
			reducedMotion.set(setting.value)
		}
	),
}

export const animatedJavaSettingsStructure: GUIStructure = [
	{
		type: 'group',
		title: translate('animated_java.settings.accessability_options_group'),
		openByDefault: true,
		children: [
			{
				type: 'setting',
				settingId: animatedJavaSettings.reduced_motion.id,
			},
		],
	},
]

export function createInfo(type: 'error' | 'warning' | 'info', info: string, formatObject = {}) {
	const lines = formatStr(info, formatObject).split('\n')
	return {
		type,
		title: lines[0],
		lines: lines.slice(1),
	}
}

export function loadAJSettings() {
	let savedSettings = localStorage.getItem('animated_java:settings')
	if (!savedSettings) savedSettings = '{}'

	const settings = JSON.parse(savedSettings)

	for (const [id, setting] of Object.entries(animatedJavaSettings)) {
		if (settings[id] !== undefined) {
			console.log('Loading setting', id, settings[id])
			setting._load(settings[id])
		}
	}
}

export function saveAJSettings() {
	const settings: Record<string, any> = {}
	for (const [id, setting] of Object.entries(animatedJavaSettings)) {
		settings[id] = setting._save()
	}
	localStorage.setItem('animated_java:settings', JSON.stringify(settings))
}

events.LOAD_PROJECT.subscribe(() => {
	loadAJSettings()
})
