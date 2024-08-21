type Targetable = Record<string, any>
type TargetKey<Target extends Targetable> = keyof Target & string
// type ModID = string
type ModInjectionMode = 'override' | 'append' | 'prepend'

// interface RegisteredFunctionMod<Target extends Targetable, Key extends TargetKey<Target>> {
// 	id: string
// 	mode: ModInjectionMode
// 	cb: (
// 		this: Target,
// 		ctx: ModContext<Target, Key>,
// 		...args: Parameters<Target[Key]>
// 	) => ModFunctionReturnResult<ReturnType<Target[Key]>>
// }

interface ModContext<Target extends Targetable, Key extends TargetKey<Target>> {
	/**
	 * The original function that was modified.
	 */
	originalFunction: Target[Key]
	/**
	 * The key of the function that was modified.
	 */
	key: Key
	/**
	 * The id of the mod that created this function.
	 */
	modId: string
	/**
	 * The injection mode of the mod that created this function.
	 */
	modMode: ModInjectionMode
}

interface ModFunctionReturnResult<T> {
	returnValue: T
	/**
	 * If injection mode is 'append', this will prevent the original function from running.
	 */
	cancelled?: boolean
}

const REGISTERED_MODS = new Map<Targetable, Map<string, any>>()

function assertEntryExists<Target extends Targetable, Key extends TargetKey<Target>>(
	target: Target,
	key: Key
) {
	if (!REGISTERED_MODS.has(target)) {
		REGISTERED_MODS.set(target, new Map())
	}
	if (!REGISTERED_MODS.get(target)!.has(key)) {
		REGISTERED_MODS.get(target)!.set(key, new Map())
	}
}

/**
 * Registers a function mod to a target object / class.
 * @param target The target object / class to modify.
 * @param key The key of the function to modify.
 * @param id The ID of the mod. Used to identify errors and conflicts.
 * @param mode The mode of the mod. Can be `override`, `append`, or `prepend`.
 * - `override` will replace the original function with the new one.
 * - `append` will run the original function first, then the new one.
 * - `prepend` will run the new function first, then the original one.
 * @param cb The callback function to run when the target function is called.
 */
export function registerFunctionMod<Target extends Targetable, Key extends TargetKey<Target>>(
	target: Target,
	key: Key,
	id: string,
	mode: ModInjectionMode,
	cb: (
		this: Target,
		ctx: ModContext<Target, Key>,
		...args: Parameters<Target[Key]>
	) => ModFunctionReturnResult<ReturnType<Target[Key]>>
) {
	console.log(target, key, id, mode, cb)
	assertEntryExists(target, key)
	const mods = REGISTERED_MODS.get(target)!.get(key)!
	if (mods.has(id)) {
		throw new Error(`Mod with ID "${id}" already exists for function "${key}"`)
	}
	mods.set(id, { id, mode, cb })
}

registerFunctionMod(Group.prototype, 'updateElement', 'my_epic_mod', 'override', function (ctx) {
	console.log('Hello World!', ctx)
	return { returnValue: this }
})

/**
 * Gets all registered mods for a target object / class.
 * @param target The target object / class to get mods for.
 * @param key (Optional) The key of the function to get mods for.
 */
export function getRegisteredMods<Target extends Targetable, Key extends TargetKey<Target>>(
	target: Target,
	key?: Key
) {
	//
}

getRegisteredMods(Group.prototype)
