import { store } from './util/store'
import { size, removeNamespace } from './util/misc'
import { safeFunctionName } from './util/replace'
import { Path } from './util/path'
import * as pathjs from 'path'
import { getModelPath } from './util/minecraft/resourcepack'
import { Items } from './util/minecraft/items'
import { tl } from './util/intl'

function genericEmptyErrorText() {
	return tl('animatedJava.settings.generic.errors.emptyValue')
}
export let ForeignSettingTranslationKeys = {}
const UNASSIGNED = Symbol('UNASSIGNED_CACHE')
export const DefaultSettings = {
	animatedJava: {
		projectName: {
			get title() {
				return tl('animatedJava.settings.projectName.title')
			},
			get description() {
				return tl('animatedJava.settings.projectName.description')
			},
			type: 'text',
			default: 'unnamed_project',
			onUpdate(d) {
				if (d.value !== '') {
					if (d.value !== safeFunctionName(d.value)) {
						d.isValid = false
						d.error = tl(
							'animatedJava.settings.projectName.errors.invalidFunctionName'
						)
					}
				} else {
					d.isValid = false
					d.error = genericEmptyErrorText()
				}
				return d
			},
		},
		exporter: {
			get title() {
				return tl('animatedJava.settings.exporter.title')
			},
			get description() {
				return tl('animatedJava.settings.exporter.description')
			},
			type: 'select',
			get default() {
				return [...store.getStore('exporters').keys()][0]
			},
			get options() {
				return Object.fromEntries(
					[...store.getStore('exporters').keys()].map((v) => [
						v,
						ForeignSettingTranslationKeys[v],
					])
				)
			},
			onUpdate(d) {
				console.log(d)
				console.log([...store.getStore('exporters').keys()])
				if (
					![...store.getStore('exporters').keys()].includes(d.value)
				) {
					d.isValid = false
					d.error = tl(
						'animatedJava.settings.exporter.errors.mustBeValidExporter'
					)
				}
				return d
			},
		},
		verbose: {
			get title() {
				return tl('animatedJava.settings.verbose.title')
			},
			get description() {
				return tl('animatedJava.settings.verbose.description')
			},
			type: 'checkbox',
			default: true,
			onUpdate(d) {
				if (!(typeof d.value === 'boolean')) {
					d.isValid = false
					d.error = tl(
						'animatedJava.settings.generic.errors.mustBeBoolean'
					)
				}
				return d
			},
		},
		rigItem: {
			get title() {
				return tl('animatedJava.settings.rigItem.title')
			},
			get description() {
				return tl('animatedJava.settings.rigItem.description')
			},
			type: 'text',
			default: 'minecraft:white_dye',
			onUpdate(d) {
				if (d.value != '') {
					if (!Items.isItem(d.value)) {
						d.isValid = false
						d.error = tl(
							'animatedJava.settings.rigItem.errors.invalidMinecraftItem'
						)
					}
				} else {
					d.isValid = false
					d.error = genericEmptyErrorText()
				}
				return d
			},
			dependencies: ['animatedJava.predicateFilePath'],
		},
		rigModelsExportFolder: {
			get title() {
				return tl('animatedJava.settings.rigModelsExportFolder.title')
			},
			get description() {
				return tl(
					'animatedJava.settings.rigModelsExportFolder.description'
				)
			},
			type: 'filepath',
			default: '',
			props: {
				target: 'folder',
				dialogOpts: {
					promptToCreate: true,
					properties: ['openDirectory'],
				},
			},
			onUpdate(d) {
				if (d.value != '') {
					let modelPath
					try {
						modelPath = getModelPath(
							pathjs.join(d.value, 'fakemodel.json')
						)
					} catch (e) {
						console.log(d.value)
						console.error(e)
						d.isValid = false
						d.error = tl(
							'animatedJava.settings.rigModelsExportFolder.errors.invalidPath'
						)
					}
				} else {
					d.isValid = false
					d.error = genericEmptyErrorText()
				}
				return d
			},
		},
		predicateFilePath: {
			get title() {
				return tl('animatedJava.settings.predicateFilePath.title')
			},
			get description() {
				return tl('animatedJava.settings.predicateFilePath.description')
			},
			type: 'filepath',
			props: {
				target: 'file',
				dialogOpts: {
					get defaultPath() {
						// console.log(store.get('settings.project'))
						return `${removeNamespace(
							ANIMATED_JAVA.settings.animatedJava.rigItem
						)}.json`
					},
					promptToCreate: true,
					properties: ['openFile'],
				},
			},
			default: '',
			onUpdate(d) {
				if (d.value != '') {
					const p = new Path(d.value)
					const b = p.parse()
					const rigItem = removeNamespace(
						ANIMATED_JAVA.settings.animatedJava.rigItem
					)
					if (`${rigItem}.json` !== b.base) {
						d.isValid = false
						d.error = tl(
							'animatedJava.settings.predicateFilePath.errors.notEqualToRigItem',
							{
								rigItem,
							}
						)
					}
				} else {
					d.isValid = false
					d.error = genericEmptyErrorText()
				}
				return d
			},
		},
		transparentTexturePath: {
			get title() {
				return tl('animatedJava.settings.transparentTexturePath.title')
			},
			get description() {
				return tl(
					'animatedJava.settings.transparentTexturePath.description'
				)
			},
			type: 'filepath',
			default: '',
			props: {
				target: 'file',
				dialogOpts: {
					defaultPath: '',
					promptToCreate: true,
					properties: ['openFile'],
				},
			},
			onUpdate(d) {
				if (d.value === '') {
					const variants = ANIMATED_JAVA.variants
					if (
						variants &&
						Object.values(variants).find((v) =>
							Object.values(v).find((t) => t === 'transparent')
						)
					) {
						d.isValid = false
						d.error = tl(
							'animatedJava.settings.transparentTexturePath.errors.undefinedWhenNeeded'
						)
					}
				}
				return d
			},
		},
		useCache: {
			get title() {
				return tl('animatedJava.settings.useCache.title')
			},
			get description() {
				return tl('animatedJava.settings.useCache.description')
			},
			type: 'checkbox',
			default: true,
			onUpdate(d) {
				return d
			},
			global: true,
		},
		cacheMode: {
			get title() {
				return tl('animatedJava.settings.cacheMode.title')
			},
			get description() {
				return tl('animatedJava.settings.cacheMode.description')
			},
			type: 'select',
			default: 'memory',
			options: {
				memory: 'animatedJava.settings.cacheMode.options.memory',
				file: 'animatedJava.settings.cacheMode.options.disk',
			},
			onUpdate(d) {
				d.isValid = Boolean(this.options[d.value])
				return d
			},
			isVisible(settings) {
				return settings.animatedJava.useCache
			},
			dependencies: ['animatedJava.useCache'],
			global: true,
		},
		boundingBoxRenderMode: {
			get title() {
				return tl('animatedJava.settings.boundingBoxRenderMode.title')
			},
			get description() {
				return tl(
					'animatedJava.settings.boundingBoxRenderMode.description'
				)
			},
			type: 'select',
			default: 'single',
			options: {
				single: 'animatedJava.settings.boundingBoxRenderMode.options.single',
				many: 'animatedJava.settings.boundingBoxRenderMode.options.many',
				none: 'animatedJava.settings.boundingBoxRenderMode.options.none',
			},
			global: true,
		},
	},
}
function createUpdateDescriptor(setting, value, event) {
	return {
		get value() {
			return value
		},
		set value(v) {
			throw new CustomError(
				'The value property on an UpdateDescriptor is not writable'
			)
		},
		isValid: true,
		error: null,
		setting,
		event,
	}
}
function handleUpdateDescriptor(descriptor) {
	const { setting, isValid, value, error } = descriptor
	setting.isValid = isValid
	if (!isValid) {
		setting.error = error
	} else {
		setting.error = null
	}
	return value
}
function evaluateSetting(event, namespace, name, value) {
	const setting = DefaultSettings[namespace]?.[name]
	if (setting) {
		if (setting.onUpdate)
			return handleUpdateDescriptor(
				setting.onUpdate(createUpdateDescriptor(setting, value, event))
			)
		DefaultSettings[namespace][name].isValid = true
		DefaultSettings[namespace][name].error = null
		return value
	} else {
		throw new CustomError('Invalid setting path', `${namespace}.${name}`)
	}
}
class Settings {
	constructor() {
		this.storage = store.getStore('settings.project')
		this.globalStorage = store.getStore('settings.global')
		this.watchers = store.getStore('settings.watchers')
		if (this.storage.size === 0) {
			this.update(DefaultSettings, true, true)
			const keys = Object.keys(DefaultSettings)
			for (let i = 0; i < keys.length; i++) {
				const namespace = keys[i]
				this.assign(namespace, Object.keys(DefaultSettings[keys[i]]))
				for (const setting in DefaultSettings[keys[i]]) {
					if (DefaultSettings[keys[i]][setting].global) {
						this.watch(`${keys[i]}.${setting}`, () => {
							localStorage.setItem(
								process.env.GLOBAL_SETTINGS_KEY,
								JSON.stringify(
									Array.from(this.globalStorage.entries())
								)
							)
						})
					}
				}
			}
		}

		try {
			let global_data = JSON.parse(
				localStorage.getItem(process.env.GLOBAL_SETTINGS_KEY)
			)
			for (const [namespace, value] of global_data) {
				for (const key in value) {
					this.set(`${namespace}.${key}`, value[key])
				}
			}
			console.log('loaded global data', global_data)
		} catch (e) {
			console.warn('failed to load global data')
			console.error(e.message)
		}
	}
	getUpdateDescriptor(namespace, name, value) {
		const setting = DefaultSettings[namespace]?.[name]
		if (setting && typeof setting.onUpdate === 'function') {
			return setting.onUpdate(
				createUpdateDescriptor(setting, value, 'dummy')
			)
		}
		return createUpdateDescriptor(setting, value, 'dummy')
	}
	assign(namespace, settings) {
		delete this[namespace]
		const value = {}
		for (let i = 0; i < settings.length; i++) {
			Object.defineProperty(value, settings[i], {
				get: () => {
					return evaluateSetting(
						'get',
						namespace,
						settings[i],
						this.get(namespace + '.' + settings[i])
					)
				},
				set: (value) => {
					const validatedValue = evaluateSetting(
						'set',
						namespace,
						settings[i],
						value
					)
					if (!DefaultSettings[namespace][settings[i]].isValid) {
						throw new CustomError(
							`Invalid setting value for ${namespace}.${settings[i]}: ${value}`
						)
					}
					return this.set(
						namespace + '.' + settings[i],
						validatedValue
					)
				},
			})
		}
		this[namespace] = value
	}
	update(settings, use_default = false, global = false) {
		if (settings === DefaultSettings) use_default = true
		Object.keys(settings).forEach((namespace) => {
			if (typeof settings[namespace] === 'object') {
				let updated = false
				const val = this.storage.get(namespace) || {}
				const valGlobal = this.globalStorage.get(namespace) || {}
				Object.keys(settings[namespace]).forEach((name) => {
					if (
						DefaultSettings[namespace] &&
						DefaultSettings[namespace][name]
					) {
						try {
							if (
								global ||
								!DefaultSettings[namespace][name].global
							) {
								// target[name] = evaluateSetting(
								// 	namespace,
								// 	name,
								// 	settings[namespace][name]
								// )
								// this[namespace][name] = target[name]
								// if (use_default)
								// target[name] = target[name].default
								this.set(
									namespace + '.' + name,
									use_default
										? DefaultSettings[namespace][name]
												.default
										: evaluateSetting(
												'update',
												namespace,
												name,
												settings[namespace][name]
										  )
								)
								updated = true
								// }
							}
							updated = true
						} catch (e) {
							console.warn(
								'failed to evaluate setting, not setting',
								{
									namespace,
									name,
								},
								e
							)
						}
					} else {
						console.warn('unknown setting', {
							namespace,
							name,
						})
					}
				})
				// if (updated) {
				// 	if (size(val)) this.storage.set(namespace, val)
				// 	if (size(valGlobal))
				// 		this.globalStorage.set(namespace, valGlobal)
				// }
			} else {
				console.warn('unknown setting', {
					namespace,
				})
			}
		})
	}

	get(path) {
		const [major, minor] = path.split('.')
		let store = this.storage
		if (
			Reflect.has(DefaultSettings, major) &&
			Reflect.has(DefaultSettings[major], minor) &&
			DefaultSettings[major][minor].global
		)
			store = this.globalStorage
		return store.get(major)?.[minor]
	}

	set(path, value) {
		const [major, minor] = path.split('.')
		let store = this.storage
		if (
			Reflect.has(DefaultSettings, major) &&
			Reflect.has(DefaultSettings[major], minor) &&
			DefaultSettings[major][minor].global
		)
			store = this.globalStorage
		let host = store.get(major)
		if (!host) {
			host = {}
			store.set(major, host)
		}

		const res = (host[minor] = value)
		store.set(major, store.get(major))
		let toUpdate = this.watchers.get(path)
		if (toUpdate) {
			toUpdate.forEach((callback) => callback(value))
		}
		return res
	}

	registerPluginSettings(exporterId, exporterSettingsKey, settings) {
		DefaultSettings[exporterSettingsKey] = settings
		ForeignSettingTranslationKeys[
			exporterSettingsKey
		] = `${exporterId}.title`
		this.update(
			{
				[exporterSettingsKey]: settings,
			},
			true
		)
		this.assign(exporterSettingsKey, Object.keys(settings))
	}

	toConsumable(target = 'all') {
		const merged = new Map()
		function merge(entries) {
			const itterable = Array.from(entries)
			itterable.forEach(([key, value]) => {
				if (!merged.has(key)) merged.set(key, {})
				const data = merged.get(key)
				for (const key in value) {
					data[key] = value[key]
				}
			})
		}
		if (target === 'project' || target === 'all')
			merge(this.storage.entries())
		if (target === 'global' || target === 'all')
			merge(this.globalStorage.entries())
		const result = {}
		Array.from(merged.entries()).forEach(([key, value]) => {
			let _cached = null
			Object.defineProperty(result, key, {
				get() {
					if (_cached) return _cached
					_cached = {}
					Array.from(Object.entries(value)).forEach(
						([key2, value2]) => {
							let _cached2 = UNASSIGNED
							Object.defineProperty(_cached, key2, {
								get() {
									if (_cached2 != UNASSIGNED) return _cached2
									_cached2 = evaluateSetting(
										'get',
										key,
										key2,
										value2
									)
									return _cached2
								},
							})
						}
					)
					return _cached
				},
			})
		})
		return result
	}
	toObject(target = 'all') {
		const obj = {}
		const keys = Object.keys(DefaultSettings)
		for (let i = 0; i < keys.length; i++) {
			const namespace = keys[i]
			const sub = {}
			const subk = Object.keys(DefaultSettings[namespace])
			for (let j = 0; j < subk.length; j++) {
				const name = subk[j]
				if (
					!!DefaultSettings[namespace][name].global ===
						(target === 'global') ||
					target === 'all'
				)
					sub[name] = this.get(namespace + '.' + name)
			}
			if (size(sub)) obj[namespace] = sub
		}
		return obj
	}
	watch(name, cb) {
		const arr = this.watchers.get(name) || []
		arr.push(cb)
		this.watchers.set(name, arr)
		return () => arr.splice(arr.indexOf(cb), 1)
	}
}
export var settings = new Settings()
export const settingsByUUID = new Map()
const updateSettingsOnProjectChange = () => {
	if (settingsByUUID.has(Project.uuid))
		settings.update(settingsByUUID.get(Project.uuid))
}
Blockbench.on('select_project', updateSettingsOnProjectChange)
