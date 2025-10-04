import EVENTS from './events'
import type { ResourceLocation } from './resourceLocation'
import { subscribable, type Subscribable } from './subscribable'

class ModInstallError extends Error {
	constructor(id: string, err: Error) {
		super(`'${id}' failed to install: ${err.message}` + (err.stack ? '\n' + err.stack : ''))
	}
}

class ModUninstallError extends Error {
	constructor(id: string, err: Error) {
		super(`'${id}' failed to uninstall: ${err.message}` + (err.stack ? '\n' + err.stack : ''))
	}
}

interface ModHandle {
	id: string
	dependencies?: string[]
	priority: number
	isInstalled(): boolean
	install: () => Promise<void>
	uninstall: () => Promise<void>
}

const REGISTERED_MODS = new Map<string, ModHandle>()
const MOD_INSTALL_ORDER: string[] = []

EVENTS.PLUGIN_LOAD.subscribe(async () => {
	console.groupCollapsed(`Installing Mods...`)

	try {
		for (const modId of MOD_INSTALL_ORDER) {
			const mod = REGISTERED_MODS.get(modId)!
			if (mod.isInstalled()) continue
			await mod.install()
		}
	} catch (e) {
		console.groupEnd()
		throw e
	}

	// Emit fake plugin load events for all already loaded plugins, so mods can hook into them
	for (const plugin of Object.values(Plugins.registered)) {
		EVENTS.EXTERNAL_PLUGIN_LOAD.publish(plugin)
	}

	console.groupEnd()
	EVENTS.PLUGIN_FINISHED_LOADING.publish()
})

EVENTS.PLUGIN_UNLOAD.subscribe(async () => {
	console.groupCollapsed(`Uninstalling Mods...`)

	try {
		for (const modId of [...MOD_INSTALL_ORDER].reverse()) {
			const mod = REGISTERED_MODS.get(modId)!
			if (!mod.isInstalled()) continue
			await mod.uninstall()
		}
	} catch (e) {
		console.groupEnd()
		throw e
	}

	for (const plugin of Object.values(Plugins.registered)) {
		EVENTS.EXTERNAL_PLUGIN_UNLOAD.publish(plugin)
	}

	console.groupEnd()
	EVENTS.PLUGIN_FINISHED_UNLOADING.publish()
})

interface BaseModOptions<ID extends string> {
	id: ResourceLocation.Validate<ID>
	/** A list of mod IDs that this mod depends on */
	dependencies?: string[]
	/** The priority of the mod. Higher priority mods will be installed first. */
	priority?: number
}

interface ModOptions<ID extends string, RevertContext extends any | void>
	extends BaseModOptions<ID> {
	/** A function that applies the mod. This function should return a context object that will be passed to the revert function. */
	apply: () => Promise<RevertContext> | RevertContext
	/**
	 * A function that reverts the mod
	 * @param ctx The context object returned by the apply function
	 */
	revert: (ctx: RevertContext) => Promise<void> | void
}

function updateModInstallOrder() {
	MOD_INSTALL_ORDER.sort((a, b) => {
		const modA = REGISTERED_MODS.get(a)!
		const modB = REGISTERED_MODS.get(b)!
		return modB.priority - modA.priority
	})

	// Ensure dependencies are installed before the mod that depends on them
	for (const modId of MOD_INSTALL_ORDER) {
		const mod = REGISTERED_MODS.get(modId)!
		if (mod.dependencies === undefined) continue
		for (const dependencyId of mod.dependencies) {
			const dependencyIndex = MOD_INSTALL_ORDER.indexOf(dependencyId)
			if (dependencyIndex === -1) {
				throw new Error(`Mod '${modId}' depends on unknown mod '${dependencyId}'`)
			}
			const modIndex = MOD_INSTALL_ORDER.indexOf(modId)
			if (dependencyIndex > modIndex) {
				// Move the dependency before the mod
				MOD_INSTALL_ORDER.splice(dependencyIndex, 1)
				MOD_INSTALL_ORDER.splice(modIndex, 0, dependencyId)
			}
		}
	}
}

/**
 * Registers a new mod. Mods are changes that need to be applied when the plugin is loaded, and reverted when the plugin is unloaded.
 *
 * Mods can depend on other mods, and will be installed in the correct order.
 *
 * If a mod fails to install, an error will be thrown, and the plugin will fail to load.
 */
export function registerMod<ID extends string, RevertContext extends any | void>(
	options: ModOptions<ID, RevertContext>
) {
	let applyContext: RevertContext
	let installed = false

	if (REGISTERED_MODS.has(options.id)) {
		throw new Error(`A Mod with the ID '${options.id}' is already registered!`)
	}

	const handle: ModHandle = {
		id: options.id,
		dependencies: options.dependencies,
		priority: options.priority ?? 0,
		isInstalled() {
			return installed
		},
		async install() {
			console.log(`Installing '${options.id}'`)
			try {
				if (installed)
					throw new Error(
						`Attempted to install '${options.id}' while it was already installed.`
					)
				applyContext = await options.apply()
				installed = true
			} catch (err) {
				throw new ModInstallError(options.id, err as Error)
			}
		},
		async uninstall() {
			console.log(`Uninstalling '${options.id}'`)
			try {
				if (!installed)
					throw new Error(
						`Attempted to uninstall '${options.id}' before it was installed.`
					)
				await options.revert(applyContext)
				installed = false
			} catch (err) {
				throw new ModUninstallError(options.id, err as Error)
			}
		},
	}

	REGISTERED_MODS.set(options.id, handle)
	MOD_INSTALL_ORDER.push(options.id)
	updateModInstallOrder()

	return handle
}

interface RegisterProjectModOptions<ID extends string, RevertContext extends any | void>
	extends ModOptions<ID, RevertContext> {
	apply: () => RevertContext
	revert: (ctx: RevertContext) => void
	/** A function that checks if the mod should be applied when switching projects */
	condition: (project: ModelProject) => boolean
}

/**
 * Registers a mod that is applied / reverted when a project is selected / unselected that meets the provided condition.
 */
export function registerProjectMod<ID extends string, RevertContext extends any | void>(
	options: RegisterProjectModOptions<ID, RevertContext>
) {
	let revertContext: RevertContext | undefined

	return registerMod({
		...options,

		apply: () => {
			return [
				EVENTS.PRE_SELECT_PROJECT.subscribe(project => {
					console.log('Checking project mod condition for', options.id, project)
					if (!options.condition(project)) return
					console.log(`Applying project mod '${options.id}'`)
					revertContext = options.apply()
				}),

				EVENTS.UNSELECT_PROJECT.subscribe(project => {
					// Effectively using revertContext as a boolean to check if the mod is applied
					if (revertContext !== undefined) {
						console.log(`Reverting project mod '${options.id}'`)
						options.revert(revertContext)
						revertContext = undefined
					}
				}),
			]
		},

		revert: ctx => {
			ctx.forEach(unsub => unsub())
		},
	})
}

interface RegisterPluginModOptions<ID extends string, RevertContext extends any | void>
	extends ModOptions<ID, RevertContext> {
	apply: () => RevertContext
	revert: (ctx: RevertContext) => void
	/** A function that checks if the mod should be applied when the plugin is loaded */
	condition: (plugin: BBPlugin) => boolean
}

/**
 * Registers a mod that is applied / reverted when a plugin is loaded / unloaded that meets the provided condition.
 */
export function registerPluginMod<ID extends string, RevertContext extends any | void>(
	options: RegisterPluginModOptions<ID, RevertContext>
) {
	let revertContext: RevertContext | undefined

	return registerMod({
		...options,

		apply: () => {
			return [
				EVENTS.EXTERNAL_PLUGIN_LOAD.subscribe(plugin => {
					if (!Condition(options.condition, plugin)) return
					console.log(`Applying plugin mod '${options.id}'`)
					revertContext = options.apply()
				}),

				EVENTS.EXTERNAL_PLUGIN_UNLOAD.subscribe(plugin => {
					// Effectively using revertContext as a boolean to check if the mod is applied
					if (revertContext !== undefined) {
						console.log(`Reverting plugin mod '${options.id}'`)
						options.revert(revertContext)
						revertContext = undefined
					}
				}),
			]
		},

		revert: ctx => {
			ctx.forEach(unsub => unsub())
		},
	})
}

interface DeletableEventHandler<T> {
	/** The current instance of this deletable */
	get(): T | null
	onCreated: Subscribable<T>['subscribe']
	onDeleted: Subscribable<T>['subscribe']
}

interface RegisterDeletableOptions<ID extends string> extends BaseModOptions<ID> {}

/**
 * Defines a new deletable register function, that handles the creation and deletion of deletables on the appropriate Blockbench events.
 */
function registerDeletableFactory<T extends Deletable, A extends any[]>(
	createInstance: (id: string, ...args: A) => T,
	deleteInstance: (instance: T) => void
) {
	return function handler<ID extends string>(
		{ id, priority, dependencies }: RegisterDeletableOptions<ID>,
		...args: A
	) {
		let activeInstance: T | null
		const created = subscribable<T>()
		const deleted = subscribable<T>()

		const handle: DeletableEventHandler<T> = {
			get: () => activeInstance,
			onCreated: created.subscribe,
			onDeleted: deleted.subscribe,
		}

		registerMod({
			id,
			priority,
			dependencies,
			apply: () => {
				activeInstance = createInstance(id, ...args)
				created.publish(activeInstance)
				return activeInstance
			},
			revert: lastInstance => {
				deleteInstance(lastInstance)
				activeInstance = null
				deleted.publish(lastInstance)
			},
		})

		return handle
	}
}

/**
 * Defines a new Blockbench.Action, and handles it's creation and deletion on the appropriate Blockbench events.
 *
 * See https://www.blockbench.net/wiki/api/action for more information on the Blockbench.Action class.
 */
export const registerAction = registerDeletableFactory(
	(id, options: ActionOptions) => new Action(id, options),
	action => action.delete()
)

/**
 * Defines a new Blockbench.ModelFormat, and handles it's creation and deletion on the appropriate Blockbench events.
 *
 * See https://www.blockbench.net/wiki/api/modelformat for more information on the Blockbench.ModelFormat class.
 */
export const registerModelFormat = registerDeletableFactory(
	(id, options: Omit<FormatOptions, 'id'>) => new ModelFormat({ ...options, id }),
	format => format.delete()
)

/**
 * Defines a new Blockbench.Codec, and handles it's creation and deletion on the appropriate Blockbench events.
 *
 * See https://www.blockbench.net/wiki/api/codec for more information on the Blockbench.Codec class.
 */
export const registerCodec = registerDeletableFactory(
	(id, options: CodecOptions) => new Codec(id, { ...options }),
	codec => codec.delete()
)

export const registerBarMenu = registerDeletableFactory(
	(id, structure: MenuItem[], options?: BarMenuOptions) => new BarMenu(id, structure, options),
	menubar => {
		// Swap over to this when Blockbench updates to 5.0
		// menubar.delete()
		// Temporary implementation of `menubar.delete()` from Blockbench 5.0
		// @ts-expect-error
		menubar.node.remove()
		menubar.label.remove()
		delete MenuBar.menus[menubar.id]
	}
)

export const registerModelLoader = registerDeletableFactory(
	(id, options: Omit<ModelLoaderOptions, 'id'>) => new ModelLoader(id, options),
	loader => loader.delete()
)

export const registerMenu = registerDeletableFactory(
	(id, template: MenuItem[] | ((context?: any) => MenuItem[]), options: MenuOptions) =>
		new Menu(id, template, options),
	menu => {
		// Swap over to this when Blockbench updates to 5.0
		// menu.delete()
		// Temporary implementation of `menu.delete()` from Blockbench 5.0
		// @ts-expect-error
		menu.node.remove()
	}
)

interface PropertyOverrideModOptions<
	ID extends string,
	T extends Object,
	K extends keyof T,
	O extends T[K]
> extends BaseModOptions<ID> {
	object: T
	key: K
	override: (this: T, original: T[K]) => O
}

export function registerPropertyOverrideMod<
	ID extends string,
	T extends Object,
	K extends keyof T,
	O extends T[K]
>(options: PropertyOverrideModOptions<ID, T, K, O>) {
	let originalValue = options.object[options.key]

	const originalDescriptor = Object.getOwnPropertyDescriptor(options.object, options.key) ?? {
		value: originalValue,
		writable: true,
		configurable: true,
	}

	if (originalDescriptor.configurable === false) {
		throw new Error(
			`Cannot override property '${String(
				options.key
			)}' on object because it is not configurable.`
		)
	}

	registerMod({
		...options,

		apply: () => {
			Object.defineProperty(options.object, options.key, {
				configurable: true,
				get() {
					return options.override.call(this, originalValue)
				},
				set(value) {
					originalValue = value
				},
			})
		},

		revert: () => {
			Object.defineProperty(options.object, options.key, originalDescriptor)
		},
	})
}

interface ConditionalPropertyOverrideModOptions<
	ID extends string,
	T extends Object,
	K extends keyof T,
	O extends T[K]
> extends BaseModOptions<ID> {
	object: T
	key: K
	get?: {
		condition: ConditionResolvable<T>
		override: (this: T, original: T[K]) => O
	}
	set?: {
		condition: ConditionResolvable<T>
		override: (this: T, value: T[K]) => O
	}
}

export function registerConditionalPropertyOverrideMod<
	ID extends string,
	T extends Object,
	K extends keyof T,
	O extends T[K]
>(options: ConditionalPropertyOverrideModOptions<ID, T, K, O>) {
	let originalValue = options.object[options.key]

	const originalDescriptor = Object.getOwnPropertyDescriptor(options.object, options.key) ?? {
		value: originalValue,
		writable: true,
		configurable: true,
	}

	if (originalDescriptor.configurable === false) {
		throw new Error(
			`Cannot override property '${String(
				options.key
			)}' on object because it is not configurable.`
		)
	}

	registerMod({
		...options,

		apply: () => {
			Object.defineProperty(options.object, options.key, {
				configurable: true,
				get: options.get
					? function (this: T) {
							if (Condition(options.get!.condition, this)) {
								return options.get!.override.call(this, originalValue)
							}
							return originalValue
					  }
					: () => originalValue,
				set: options.set
					? function (this: T, value) {
							originalValue = value
					  }
					: value => (originalValue = value),
			})
		},

		revert: () => {
			Object.defineProperty(options.object, options.key, originalDescriptor)
		},
	})
}

interface Storage<Value = any> {
	value: Value
}
const SUBSCRIBABLES = new Map<
	any,
	[
		Subscribable<{ storage: Storage<any>; value: any }>,
		Subscribable<{ storage: Storage<any>; newValue: any }>
	]
>()

/**
 * Creates a subscribable for a property on an object.
 * @param object The object to create the subscribable for.
 * @param key The key of the property on the object.
 * @returns A tuple of {@link Subscribable | Subscribables} [onGet, onSet]
 * @example
 * Using the subscribables as simple EVENTS.
 * ```ts
 * const [onGet, onSet] = createPropertySubscribable(Blockbench, 'version')
 * onGet.subscribe(({ value }) => console.log('Blockbench version:', value))
 * onSet.subscribe(({ newValue }) => console.log('Blockbench version changed to:', newValue))
 * ```
 * @example
 * Using the subscribables to change the value of a Property.
 * ```ts
 * const [, onSet] = createPropertySubscribable(Blockbench, 'version')
 * onSet.subscribe(({ storage, newValue }) => {
 * 	if (newValue === '1.0.0') storage.value = '1.0.1'
 * })
 * ```
 * Note that `storage.value` can be modified by other subscribers, but `newValue` is the value that was set.
 * You decide if you want to operate on `newValue` or the possibly modified `storage.value`.

 * The Getter can also modify `storage.value`, but this is not recommended.
 */
export function createPropertySubscribable<Value = any>(object: any, key: string) {
	let subscribables = SUBSCRIBABLES.get(object)
	const storage: Storage<Value> = { value: object[key] }

	if (subscribables === undefined) {
		const onGet = subscribable<{
			storage: Storage<Value>
			value: Value
		}>()
		const onSet = subscribable<{ storage: Storage<Value>; newValue: Value }>()
		subscribables = [onGet, onSet]
		SUBSCRIBABLES.set(object, subscribables)

		Object.defineProperty(object, key, {
			get() {
				onGet.publish({ storage, value: storage.value })
				return storage.value
			},
			set(newValue: Value) {
				storage.value = newValue
				onSet.publish({ storage, newValue })
			},
			configurable: true,
		})

		EVENTS.PLUGIN_UNLOAD.subscribe(() => {
			const value = object[key]
			delete object[key]
			Object.defineProperty(object, key, {
				value,
				configurable: true,
			})
		}, true)
	}

	return subscribables
}

/**
 * A wrapper for the Blockbench.Property class that deep-clones the property value when copying or merging.
 */
export class ObjectProperty extends Property<'object'> {
	constructor(target: any, name: string, options: PropertyOptions) {
		super(target, 'object', name, options)
	}

	copy(instance: any, target: any) {
		if (instance[this.name] == undefined) {
			target[this.name] = instance[this.name]
		} else {
			target[this.name] = JSON.parse(JSON.stringify(instance[this.name]))
		}
	}

	merge(instance: any, data: any) {
		if (data[this.name] == undefined) {
			instance[this.name] = this.default
		} else {
			instance[this.name] = JSON.parse(JSON.stringify(data[this.name]))
		}
	}
}

export const fixClassPropertyInheritance: ClassDecorator = target => {
	target.properties = { ...target.properties }
	return target
}
