import EVENTS from '@events'
import type { ValidateResourceLocation } from './resourceLocation'
import { subscribable, type Subscribable } from './subscribable'

class PatchInstallError extends Error {
	constructor(id: string, err: Error) {
		super(`Mod '${id}' failed to install: ${err.message}` + (err.stack ? '\n' + err.stack : ''))
	}
}

class PatchUninstallError extends Error {
	constructor(id: string, err: Error) {
		super(
			`Mod '${id}' failed to uninstall: ${err.message}` + (err.stack ? '\n' + err.stack : '')
		)
	}
}

interface PatchHandle {
	id: string
	priority: number
	isApplied(): boolean
	install: () => void
	uninstall: () => void
}

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	var MONKEY_PATCHES: PatchHandle[]
}
window.MONKEY_PATCHES ??= []

EVENTS.INSTALL_PATCHES.subscribe(() => {
	console.groupCollapsed(`Installing Patches`)
	for (const patch of MONKEY_PATCHES) {
		if (patch.isApplied()) {
			console.warn(`Patch '${patch.id}' is already installed, skipping install.`)
			continue
		}
		patch.install()
	}
	console.groupEnd()
})

EVENTS.UNINSTALL_PATCHES.subscribe(() => {
	console.groupCollapsed(`Uninstalling Patches`)
	for (const patch of MONKEY_PATCHES) {
		if (!patch.isApplied()) {
			console.warn(`Patch '${patch.id}' is not installed, skipping uninstall.`)
			continue
		}
		patch.uninstall()
	}
	console.groupEnd()
})

/**
 * A generic framework for creating Blockbench patches.
 *
 * If possible, you should use more specific functions like {@link createAction} or {@link createFunctionPatch} instead of this function whenever possible.
 *
 * @example
 * ```ts
 * createPatch({
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
export function createGenericPatch<
	ID extends string,
	ApplyContext extends any,
	RevertContext extends ApplyContext | void,
>({
	id,
	collectContext,
	apply,
	revert,
	priority = 0,
}: {
	id: ValidateResourceLocation<ID>
	collectContext?: () => ApplyContext
	apply: (ctx: ApplyContext) => RevertContext
	revert: (ctx: RevertContext) => void
	priority?: number
	autoInstall?: boolean
}) {
	let revertContext: RevertContext
	let applied = false

	const handle: PatchHandle = {
		id,
		priority,
		isApplied() {
			return applied
		},
		install() {
			console.log(`Installing Patch '${id}'`)
			try {
				if (applied) throw new Error('Mod is already installed!')
				const context = collectContext?.()!
				revertContext = apply(context)
				applied = true
			} catch (err) {
				throw new PatchInstallError(id, err as Error)
			}
		},
		uninstall() {
			console.log(`Uninstalling Patch '${id}'`)
			try {
				if (!applied) throw new Error('Mod is not installed!')
				revert(revertContext)
				applied = false
			} catch (err) {
				throw new PatchUninstallError(id, err as Error)
			}
		},
	}

	MONKEY_PATCHES.push(handle)
	MONKEY_PATCHES.sort((a, b) => a.priority - b.priority)

	return handle
}

type CreateActionOptions = ActionOptions & {
	/**
	 * @param path Path pointing to the location. Use the ID of each level of the menu, or index or group within a level, separated by a period. For example; `file.export.0` places the action at the top position of the Export submenu in the File menu.
	 */
	menu_path?: string
}
/** Creates a new Blockbench.Action and automatically handles it's deletion on the plugin unload and uninstall events.
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

	EVENTS.UNINSTALL_PATCHES.subscribe(() => {
		if (options.menu_path !== undefined) {
			MenuBar.removeAction(options.menu_path)
		}
		action.delete()
	}, true)

	return action
}

// /**
//  * Creates a new Blockbench.ModelLoader and automatically handles it's deletion on the plugin unload and uninstall events.
//  * @param id A namespaced ID ('my-plugin-id:my-model-loader')
//  * @param options The options for the model loader.
//  * @returns The created model loader.
//  */
// export function createModelLoader(id: string, options: ModelLoaderOptions): ModelLoader {
// 	const modelLoader = new ModelLoader(id, options)

// 	EVENTS.UNINSTALL_PATCHES.subscribe(() => {
// 		modelLoader.delete()
// 	}, true)

// 	return modelLoader
// }

/**
 * Creates a new Blockbench.Menu and automatically handles it's deletion on the plugin unload and uninstall events.
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
 * Creates a new Blockbench.BarMenu and automatically handles it's deletion on the plugin unload and uninstall events.
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

		EVENTS.UNINSTALL_PATCHES.subscribe(() => {
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

type PatchableObject = Record<string, any>

type PatchableFunction<P extends any[], R extends any> = (...args: P) => R

type ExtractPatchableFunctionKeys<T> = keyof {
	[Key in keyof T]: T[Key] extends PatchableFunction<infer P, infer R>
		? PatchableFunction<P, R>
		: never
}

/**
 * Points at which a function can be injected.
 *
 * 'HEAD' - At the start of the function.
 *
 * 'RETURN' - After the function has returned, but before the return value is passed to the caller.
 */
type InjectionPoint = 'HEAD' | 'RETURN'

type FunctionPatchContext<
	FunctionOwner extends PatchableObject,
	Key extends ExtractPatchableFunctionKeys<FunctionOwner>,
	At extends InjectionPoint,
	TargetFunction extends FunctionOwner[Key] = FunctionOwner[Key],
> = {
	target: FunctionOwner
	sourceFunction: TargetFunction
	args: Parameters<TargetFunction>
	/** Set the function's return value */
	setReturnValue: (value: ReturnType<TargetFunction>) => void
	/** Get the function's return value, if it has been set */
	getReturnValue: () => ReturnType<TargetFunction> | undefined
} & (At extends 'HEAD'
	? {
			/** Cancel the function's execution and return void */
			cancel: () => void
		}
	: {})

interface FunctionPatchOptions<
	ID extends string,
	FunctionOwner extends PatchableObject,
	Key extends ExtractPatchableFunctionKeys<FunctionOwner>,
	At extends InjectionPoint,
	TargetFunction extends FunctionOwner[Key] = FunctionOwner[Key],
> {
	/** The ID of the the patch. */
	id: ValidateResourceLocation<ID>
	/** The object or class to overwrite the function on. */
	target: FunctionOwner
	/** The key of the function to overwrite. */
	key: Key
	/** Where to inject the function. */
	at: At
	/** The priority of the patch. Higher priority patches will wrap lower ones. */
	priority?: number
	/** The function to overwrite the original function with. */
	callback: (
		this: FunctionOwner,
		ctx: FunctionPatchContext<FunctionOwner, Key, At, TargetFunction>
	) => void
}

/**
 * Creates a patch that injects code into an existing function on a class or object by overwriting the function directly at runtime.
 *
 * This is a very powerful tool, but should be used sparingly, as it creates a hard dependency on the internal implementation of Blockbench,
 * and is prone to causing conflicts with other plugins that patch the same function.
 *
 * Commonly known as "monkey patching" 🙈
 */
export function createFunctionPatch<
	ID extends string,
	FunctionOwner extends PatchableObject,
	Key extends ExtractPatchableFunctionKeys<FunctionOwner>,
	At extends InjectionPoint,
	TargetFunction extends FunctionOwner[Key],
>({
	id,
	target,
	key,
	at,
	priority,
	callback,
}: FunctionPatchOptions<ID, FunctionOwner, Key, At, TargetFunction>): void {
	createGenericPatch({
		id,
		priority,
		collectContext: () => ({ sourceFunction: target[key] }),
		apply: ({ sourceFunction }) => {
			if (typeof sourceFunction !== 'function') {
				throw new Error(`Cannot patch non-function property '${key as string}'`)
			}

			let overrideFunction: TargetFunction

			switch (at) {
				case 'HEAD': {
					overrideFunction = function (
						this: FunctionOwner,
						...args: Parameters<TargetFunction>
					) {
						let returnValue: ReturnType<TargetFunction> | undefined
						let returnValueChanged = false
						let cancelled = false
						const ctx: FunctionPatchContext<
							FunctionOwner,
							Key,
							'HEAD',
							TargetFunction
						> = {
							target,
							sourceFunction,
							args,
							setReturnValue(value) {
								returnValue = value
								returnValueChanged = true
							},
							getReturnValue() {
								return returnValue
							},
							cancel() {
								cancelled = true
							},
						}
						callback.call(this, ctx)
						if (cancelled) return
						if (returnValueChanged) return returnValue
						return sourceFunction.apply(this, args)
					} as TargetFunction
					break
				}

				case 'RETURN': {
					overrideFunction = function (
						this: FunctionOwner,
						...args: Parameters<TargetFunction>
					) {
						let returnValue: ReturnType<TargetFunction> = sourceFunction.apply(
							this,
							args
						)
						const ctx: FunctionPatchContext<
							FunctionOwner,
							Key,
							'RETURN',
							TargetFunction
						> = {
							target,
							sourceFunction,
							args,
							setReturnValue(value) {
								returnValue = value
							},
							getReturnValue() {
								return returnValue
							},
						}
						// @ts-expect-error
						callback.call(this, ctx)
						return returnValue
					} as TargetFunction
					break
				}
			}

			target[key] = overrideFunction
			return { sourceFunction }
		},
		revert: ({ sourceFunction }) => {
			target[key] = sourceFunction
		},
	})
}

// /**
//  * A wrapper for the Blockbench.Property class that deep-clones the property value when copying or merging.
//  */
// export class ObjectProperty extends Property<'object'> {
// 	constructor(target: any, name: string, options: PropertyOptions) {
// 		super(target, 'object', name, options)
// 	}

// 	copy(instance: any, target: any) {
// 		if (instance[this.name] == undefined) {
// 			target[this.name] = instance[this.name]
// 		} else {
// 			target[this.name] = JSON.parse(JSON.stringify(instance[this.name]))
// 		}
// 	}

// 	merge(instance: any, data: any) {
// 		if (data[this.name] == undefined) {
// 			instance[this.name] = this.default
// 		} else {
// 			instance[this.name] = JSON.parse(JSON.stringify(data[this.name]))
// 		}
// 	}
// }

// export const fixClassPropertyInheritance: ClassDecorator = target => {
// 	target.properties = { ...target.properties }
// 	return target
// }
