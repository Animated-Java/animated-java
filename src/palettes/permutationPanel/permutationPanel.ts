import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { SveltePanel } from 'svelte-patching-tools/blockbench'
import { isEnabled, translate } from '../host'
import { COLORWAY_PREVIEW, PAINT_CONTEXT, previewColorway } from '../paintState'
import PermutationPanel from './permutationPanel.svelte'

const COLORWAY_FIELD = 'colorway'
/** The colorway select's value for showing every recolor in its own colorway. */
const AS_ASSIGNED = 'as_assigned'

/**
 * Rebuilds the panel's form for the painted set: one select, labelled with the set's name, that
 * previews a colorway on the model. Built like the Element panel's form, so it looks the same.
 */
function buildColorwayForm(form: InputForm) {
	for (const key in form.form_config) delete form.form_config[key]
	const context = PAINT_CONTEXT.get()
	const previewed = context && COLORWAY_PREVIEW.get()[context.set.uuid]
	if (context) {
		const { set, permutation } = context
		const { permutations } = set.palette_set
		const assigned =
			permutations.find(p => p.uuid === permutation)?.suffix ?? translate('dialog.set.key')
		form.form_config[COLORWAY_FIELD] = {
			label: set.name,
			description: translate('permutation_panel.colorway'),
			type: 'select',
			value: previewed ?? AS_ASSIGNED,
			options: {
				[AS_ASSIGNED]: translate('permutation_panel.as_assigned', assigned),
				_permutations: new MenuSeparator('permutations'),
				...Object.fromEntries(permutations.map(p => [p.uuid, p.suffix])),
			} as unknown as Record<string, string>,
		}
	}
	form.buildForm()
	// Blockbench's form selects can't show an option's icon, so add the eye while previewing.
	if (previewed) {
		form.node.querySelector('.bb-select')?.prepend(Blockbench.getIconNode('visibility'))
	}
}

/** Edits the key and palette of the Permutation Set texture being painted. */
registerDeletableHandlerPatch({
	id: 'animated_java:panel/permutation',
	create() {
		const form = new InputForm({})
		form.on('input', ({ result }: { result: Record<string, unknown> }) => {
			const set = PAINT_CONTEXT.get()?.set
			const value = result[COLORWAY_FIELD]
			if (!set || typeof value !== 'string') return
			previewColorway(set, value === AS_ASSIGNED ? undefined : value)
		})
		const panel = new SveltePanel({
			id: 'animated_java:permutation-panel',
			name: translate('permutation_panel.title'),
			icon: 'palette',
			expand_button: false,
			default_side: 'right',
			insert_after: 'color',
			default_position: {
				slot: 'right_bar',
				// Positions are per UI mode, and `insert_after` only places it in the mode active
				// at load. This is just after the Color panel's default index, for the rest.
				sidebar_index: 5,
				float_position: [0, 0],
				float_size: [300, 200],
				height: 200,
				folded: false,
			},
			condition: () => isEnabled() && Modes.paint,
			form,
			component: PermutationPanel,
			props: {},
		})
		const rebuild = () => buildColorwayForm(form)
		const unsubscribers = [
			PAINT_CONTEXT.subscribe(rebuild),
			COLORWAY_PREVIEW.subscribe(rebuild),
		]
		return {
			delete() {
				for (const unsubscribe of unsubscribers) unsubscribe()
				panel.delete()
			},
		}
	},
})
