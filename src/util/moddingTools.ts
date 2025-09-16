import EVENTS from '@events'
import type { ValidateResourceLocation } from './resourceLocation'
import { subscribable, type Subscribable } from './subscribable'

// Useful for describing context variables that will become BlochBench class properties in the inject function.
export type ContextProperty<Type extends keyof IPropertyType> = Property<Type> | undefined

class BlockbenchModInstallError extends Error {
	constructor(id: string, err: Error) {
		super(`Mod '${id}' failed to install: ${err.message}` + (err.stack ? '\n' + err.stack : ''))
	}
}

class BlockbenchModUninstallError extends Error {
	constructor(id: string, err: Error) {
		super(
			`Mod '${id}' failed to uninstall: ${err.message}` + (err.stack ? '\n' + err.stack : '')
		)
	}
}

interface BlockbenchMod {
	applied: boolean
	install: () => void
	uninstall: () => void
}

/**
 * A framework for creating Blockbench mods that automatically handles installation and uninstallation on the appropriate Blockbench EVENTS.
 * @example
 * ```ts
 * createBlockbenchMod({
 * 	id: 'my-plugin-id:my-mod',
 * 	collectContext: () => ({
 * 		original: Blockbench.Animation.prototype.select
 * 	}),
 * 	apply: ctx => {
 * 		// Apply changes
 * 		Blockbench.Animation.prototype.select = function(this: _Animation) {
 * 			if (Format.id === myFormat.id) {
 * 				// Do something here
 * 			}
 * 			return ctx.original.call(this)
 * 		}
 * 		return ctx
 * 	},
 * 	revert: ctx => {
 * 		// Revert changes
 * 		Blockbench.Animation.prototype.select = ctx.original
 * 	}
 * }
 * ```
 */
export function createBlockbenchMod<
	ID extends string,
	ApplyContext extends any,
	RevertContext extends ApplyContext | void,
>({
	id,
	collectContext,
	apply,
	revert,
	autoInstall = true,
}: {
	id: ValidateResourceLocation<ID>
	collectContext?: () => ApplyContext
	apply: (ctx: ApplyContext) => RevertContext
	revert: (ctx: RevertContext) => void
	autoInstall?: boolean
}) {
	let applyContext: RevertContext

	const handle: BlockbenchMod = {
		applied: false,
		install() {
			try {
				if (this.applied) throw new Error('Mod is already installed!')
				const context = collectContext?.()!
				applyContext = apply(context)
				this.applied = true
			} catch (err) {
				throw new BlockbenchModInstallError(id, err as Error)
			}
		},
		uninstall() {
			try {
				if (!this.applied) throw new Error('Mod is not installed!')
				revert(applyContext)
				this.applied = false
			} catch (err) {
				throw new BlockbenchModUninstallError(id, err as Error)
			}
		},
	}

	if (autoInstall) {
		EVENTS.INSTALL_MODS.subscribe(handle.install.bind(handle))
	}
	EVENTS.UNINSTALL_MODS.subscribe(handle.uninstall.bind(handle))

	return handle
}

type CreateActionOptions = ActionOptions & {
	/**
	 * @param path Path pointing to the location. Use the ID of each level of the menu, or index or group within a level, separated by a period. For example; `file.export.0` places the action at the top position of the Export submenu in the File menu.
	 */
	menu_path?: string
}
/** Creates a new Blockbench.Action and automatically handles it's deletion on the plugin unload and uninstall EVENTS.
 * See https://www.blockbench.net/wiki/api/action for more information on the Blockbench.Action class.
 * @param id A namespaced ID ('my-plugin-id:my-action')
 * @param options The options for the action.
 * @returns The created action.
 */
export function createAction<ID extends string>(
	id: ValidateResourceLocation<ID>,
	options: CreateActionOptions
) {
	const action = new Action(id, options)
	if (options.menu_path !== undefined) {
		MenuBar.addAction(action, options.menu_path)
	}

	EVENTS.UNINSTALL_MODS.subscribe(() => {
		if (options.menu_path !== undefined) {
			MenuBar.removeAction(options.menu_path)
		}
		action.delete()
	}, true)

	return action
}

/**
 * Creates a new Blockbench.ModelLoader and automatically handles it's deletion on the plugin unload and uninstall EVENTS.
 * @param id A namespaced ID ('my-plugin-id:my-model-loader')
 * @param options The options for the model loader.
 * @returns The created model loader.
 */
export function createModelLoader(id: string, options: ModelLoaderOptions): ModelLoader {
	const modelLoader = new ModelLoader(id, options)

	EVENTS.UNINSTALL_MODS.subscribe(() => {
		modelLoader.delete()
	}, true)

	return modelLoader
}

/**
 * Creates a new Blockbench.Menu and automatically handles it's deletion on the plugin unload and uninstall EVENTS.
 * See https://www.blockbench.net/wiki/api/menu for more information on the Blockbench.Menu class.
 * @param template The menu template.
 * @param options The options for the menu.
 * @returns The created menu.
 */
export function createMenu(template: MenuItem[], options?: MenuOptions) {
	const menu = new Menu(template, options)

	// EVENTS.EXTRACT_MODS.subscribe(() => {
	// 	menu.delete()
	// }, true)

	return menu
}

/**
 * Creates a new Blockbench.BarMenu and automatically handles it's deletion on the plugin unload and uninstall EVENTS.
 * @param id A namespaced ID ('my-plugin-id:my-menu')
 * @param structure The menu structure.
 * @param condition The condition for the menu to be visible.
 * @returns The created menu.
 */
export function createBarMenu<ID extends string>(
	id: ValidateResourceLocation<ID>,
	structure: MenuItem[],
	condition: ConditionResolvable
) {
	const menu = new BarMenu(id, structure, condition)

	// EVENTS.EXTRACT_MODS.subscribe(() => {
	// 	menu.delete()
	// }, true)

	return menu
}

interface Storage<Value = any> {
	value: Value
}
const SUBSCRIBABLES = new Map<
	any,
	[
		Subscribable<{ storage: Storage<any>; value: any }>,
		Subscribable<{ storage: Storage<any>; newValue: any }>,
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

		EVENTS.UNINSTALL_MODS.subscribe(() => {
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

// export function overwriteFunction<Target extends Record<string, any>, Key extends string>(
// 	/**
// 	 * The object or class to overwrite the function on.
// 	 */
// 	target: Target,
// 	/**
// 	 * The key of the function to overwrite.
// 	 */
// 	key: string,
// 	/**
// 	 * The function to overwrite the original function with.
// 	 */
// 	callback: (target: Target, originalFunction: Target[Key]) => void,
// 	/**
// 	 * The priority of the overwrite. Higher priority overwrites are called first.
// 	 */
// 	priority?: number
// ) {
// 	//
// }

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
