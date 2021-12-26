import { store, size, safeFunctionName } from './util'
const UNASSIGNED = Symbol('UNASSIGNED_CACHE')
export const DefaultSettings = {
	animatedJava: {
		projectName: {
			type: 'text',
			default: 'unnamed_project',
			populate(value) {
				if (typeof value === 'string') return safeFunctionName(value)
				else return 'undefined_project'
			},
			isValid(value) {
				if (typeof value === 'string')
					return value === safeFunctionName(value)
				else return false
			},
		},
		exporter: {
			type: 'select',
			default: undefined,
			get options() {
				return Object.fromEntries([...store.getStore('exporters').keys()].map(v => [v,`animatedJava.exporter.${v}`]))
			},
			populate() {
				return [...store.getStore('exporters').keys()][0]
			},
			isValid(value) {
				return [...store.getStore('exporters').keys()].includes(value)
			},
		},
		rigItem: {
			type: 'text',
			default: 'minecraft:white_dye',
			populate() {
				return 'minecraft:white_dye'
			},
			isValid(value) {
				return true
			},
		},
		rigModelsExportFolder: {
			type: 'filepath',
			default: '',
			props: {
				target: 'folder',
				dialogOpts: {
					promptToCreate: true,
					properties: ['openDirectory'],
				},
			},
			populate() {
				return ''
			},
			isValid(value) {
				return true
			},
		},
		predicateFilePath: {
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
			populate() {
				return ''
			},
			isValid(value) {
				return true
			},
		},
		transparentTexturePath: {
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
			populate() {
				return ''
			},
			isValid(value) {
				return true
			},
		},
		useCache: {
			type: 'checkbox',
			default: true,
			populate() {
				return true
			},
			isValid(value) {
				return typeof value === 'boolean'
			},
			global: true,
		},
		cacheMode: {
			type: 'select',
			default: 'memory',
			options: {
				memory: 'animatedJava.setting.cacheMode.memory.name',
				file: 'animatedJava.setting.cacheMode.file.name',
			},
			populate() {
				return 'memory'
			},
			isValid(value) {
				return this.options[value]
			},
			isVisible(settings) {
				return settings.animatedJava.useCache
			},
			dependencies: ['animatedJava.useCache'],
			global: true,
		},
		boundingBoxRenderMode: {
			type: 'select',
			default: 'single',
			options: {
				single: 'animatedJava.setting.boundingBoxRenderMode.single.name',
				many: 'animatedJava.setting.boundingBoxRenderMode.many.name',
				none: 'animatedJava.setting.boundingBoxRenderMode.none.name',
			},
			populate() {
				return 'single'
			},
			isValid(value) {
				return this.options[value]
			},
			global: true,
		},
	},
}

function evaluateSetting(namespace, name, value) {
	const setting = DefaultSettings[namespace]?.[name]
	if (setting) {
		if (setting.isValid) {
			if (setting.isValid(value)) {
				return value
			} else {
				return setting.populate(value)
			}
		} else {
			return value
		}
	} else {
		throw new Error('Invalid setting path', `${namespace}.${name}`)
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
	assign(namespace, settings) {
		delete this[namespace]
		const value = {}
		for (let i = 0; i < settings.length; i++) {
			Object.defineProperty(value, settings[i], {
				get: () => {
					return evaluateSetting(
						namespace,
						settings[i],
						this.get(namespace + '.' + settings[i])
					)
				},
				set: (value) => {
					const validatedValue = evaluateSetting(
						namespace,
						settings[i],
						value
					)
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
						const target = DefaultSettings[namespace][name].global
							? valGlobal
							: val
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

	registerPluginSettings(pluginName, settings) {
		DefaultSettings[pluginName] = settings
		this.update(
			{
				[pluginName]: settings,
			},
			true
		)
		this.assign(pluginName, Object.keys(settings))
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
