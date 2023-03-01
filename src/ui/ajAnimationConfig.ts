import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/mods'
import { translate } from '../util/translation'
import { AJDialog } from './ajDialog'
import { default as SvelteComponent } from './components/animationConfig.svelte'

function openAjAnimationDialog(animation: _Animation) {
	const dialog = new AJDialog(
		SvelteComponent,
		{ animation },
		{
			title: translate('animated_java.dialog.animation_config.title'),
			id: 'animated_java:animation_config',
			width: 700,
			buttons: [translate('animated_java.dialog.animation_config.close_button')],
		}
	).show()
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
	},
	context => {
		Blockbench.Animation.prototype.propertiesDialog = context.original
	}
)
