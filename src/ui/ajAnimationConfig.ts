import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'
import { SvelteDialog } from './svelteDialog'
import { default as SvelteComponent } from './components/animationConfig.svelte'

function openAjAnimationDialog(animation: _Animation) {
	new SvelteDialog({
		title: translate('animated_java.dialog.animation_config.title'),
		id: 'animated_java:animation_config',
		width: 700,
		buttons: [translate('animated_java.dialog.close_button')],
		svelteComponent: SvelteComponent,
		svelteComponentProps: { animation },
	}).show()
}

createBlockbenchMod(
	'animated_java:animation_config',
	{
		original: Blockbench.Animation.prototype.propertiesDialog,
	},
	context => {
		Blockbench.Animation.prototype.propertiesDialog = function (this: Action) {
			if (Project?.format.id === ajModelFormat.id) {
				if (!Animator.selected) return
				openAjAnimationDialog(Animator.selected)
			} else context.original.call(this)
		}
		return context
	},
	context => {
		Blockbench.Animation.prototype.propertiesDialog = context.original
	}
)
