<script lang="ts">
	import { onDestroy } from 'svelte'
	import Checkbox from '../../../svelteComponents/sidebarDialogItems/checkbox.svelte'
	import LineEdit from '../../../svelteComponents/sidebarDialogItems/lineEdit.svelte'
	import NumberSlider from '../../../svelteComponents/sidebarDialogItems/numberSlider.svelte'
	import { createScopedTranslator } from '../../../util/lang'

	const localize = createScopedTranslator('dialog.blueprint_settings')

	let customRigEntityTags = $state(Project.animated_java.custom_rig_entity_tags)
	let interpolationDuration = $state(Project.animated_java.interpolation_duration)
	let teleportationDuration = $state(Project.animated_java.teleportation_duration)
	let useEntityStacking = $state(Project.animated_java.use_entity_stacking)

	onDestroy(() => {
		Project.animated_java.custom_rig_entity_tags = customRigEntityTags
		Project.animated_java.interpolation_duration = interpolationDuration
		Project.animated_java.teleportation_duration = teleportationDuration
		Project.animated_java.use_entity_stacking = useEntityStacking
	})
</script>

<LineEdit
	label={localize('custom_rig_entity_tags.title')}
	description={localize('custom_rig_entity_tags.description')}
	bind:value={customRigEntityTags}
></LineEdit>

<NumberSlider
	label={localize('interpolation_duration.title')}
	description={localize('interpolation_duration.description')}
	bind:value={interpolationDuration}
	step={1}
	min={0}
	max={2147483647}
/>

<NumberSlider
	label={localize('teleportation_duration.title')}
	description={localize('teleportation_duration.description')}
	bind:value={teleportationDuration}
	step={1}
	min={0}
	max={2147483647}
/>

<Checkbox
	label={localize('use_entity_stacking.title')}
	description={localize('use_entity_stacking.description')}
	bind:value={useEntityStacking}
/>
