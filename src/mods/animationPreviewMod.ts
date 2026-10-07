import { registerProjectPatch } from 'blockbench-patch-manager'
import { resetAnimationPreview, updateAnimationPreview } from '../animationPreview'
import { BLUEPRINT_FORMAT_ID } from '../formats/blueprint'

// Keeps the Variants and texture slots shown in step with the selected animation in Animate mode.
registerProjectPatch({
	id: 'animated_java:animation-preview',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply() {
		const update = () => updateAnimationPreview()
		const events: Array<keyof BlockbenchEventMap> = ['display_animation_frame', 'select_mode']
		for (const event of events) Blockbench.on(event, update)
		return { events, update }
	},

	revert({ events, update }) {
		for (const event of events) Blockbench.removeListener(event, update)
		resetAnimationPreview()
	},
})
