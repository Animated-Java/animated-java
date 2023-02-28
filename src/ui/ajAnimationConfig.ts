import { ajModelFormat } from '../modelFormat'
import { BlockbenchMod } from '../util/mods'
import { translate } from '../util/translation'
import { AJDialog } from './ajDialog'
import { default as SvelteComponent } from './components/animationConfig.svelte'

const oldAnimationPropertiesDialog = Blockbench.Animation.prototype.propertiesDialog

function animationPropertiesDialog(this: BlockbenchTypeAnimation) {
	if (Project?.format.id === ajModelFormat.id) {
		openAjAnimationDialog(this)
	} else oldAnimationPropertiesDialog.call(this)
}

function openAjAnimationDialog(animation: BlockbenchTypeAnimation) {
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

new BlockbenchMod({
	id: 'animated_java:animation_config',
	inject() {
		Blockbench.Animation.prototype.propertiesDialog = animationPropertiesDialog
	},
	extract() {
		Blockbench.Animation.prototype.propertiesDialog = oldAnimationPropertiesDialog
	},
})
