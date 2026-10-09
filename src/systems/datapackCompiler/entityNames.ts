/**
 * `CustomName` values for the entities a rig summons.
 *
 * These are deliberately empty (`""` — an empty SNBT/JSON text component). Giving
 * every bone, locator, camera and interaction a descriptive `CustomName` measurably
 * hurt tick performance on large rigs (see commit "Reduce entity names to empty
 * strings to improve performance"), and the names were only ever cosmetic in F3+B.
 *
 * The parameters are kept so callers stay self-documenting and so real names can be
 * restored here (behind a debug toggle) without touching the `.mcb` templates.
 */
namespace ENTITY_NAMES {
	export const ROOT = (_exportNamespace: string) => '""'

	export const NODE = (_exportNamespace: string, _type: string, _name: string) => '""'
}

export default ENTITY_NAMES
