<script lang="ts" , context="module">
	import Checkbox from './dialogItems/checkbox.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import LineInput from './dialogItems/lineInput.svelte'

	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	import Collection from './dialogItems/collection.svelte'
	import Select from './dialogItems/select.svelte'

	export let animationName: Valuable<string>
	export let loopMode: Valuable<string>
	export let loopDelay: Valuable<number>
	export let excludedBones: Valuable<Array<{ name: string; value: string }>>

	const availableBones = Group.all.map(group => {
		const entry = excludedBones.get().find(bone => bone.value === group.uuid)
		if (entry) {
			entry.name = group.name
		}

		return { name: group.name, value: group.uuid }
	})

	function animationNameValueChecker(value: string): { type: string; message: string } {
		if (value.trim().length === 0) {
			return {
				type: 'error',
				message: translate('dialog.animation_properties.animation_name.error.empty'),
			}
		} else if (value.match(/[^a-zA-Z0-9_\.]/)) {
			return {
				type: 'error',
				message: translate(
					'dialog.animation_properties.animation_name.error.invalid_characters',
				),
			}
		}
		return { type: 'success', message: '' }
	}
</script>

<div>
	<LineInput
		label={translate('dialog.animation_properties.animation_name.title')}
		tooltip={translate('dialog.animation_properties.animation_name.description')}
		bind:value={animationName}
		valueChecker={animationNameValueChecker}
	/>

	<Select
		label={translate('dialog.animation_properties.loop_mode.title')}
		tooltip={translate('dialog.animation_properties.loop_mode.description')}
		options={{
			once: translate('dialog.animation_properties.loop_mode.options.once'),
			hold: translate('dialog.animation_properties.loop_mode.options.hold'),
			loop: translate('dialog.animation_properties.loop_mode.options.loop'),
		}}
		defaultOption={'once'}
		bind:value={loopMode}
	/>

	<NumberSlider
		label={translate('dialog.animation_properties.loop_delay.title')}
		tooltip={translate('dialog.animation_properties.loop_delay.description')}
		min={0}
		bind:value={loopDelay}
	/>

	<Collection
		label={translate('dialog.animation_properties.excluded_bones.title')}
		tooltip={translate('dialog.animation_properties.bone_lists.description')}
		availableItemsColumnLable={translate('dialog.animation_properties.included_bones.title')}
		availableItemsColumnTooltip={translate(
			'dialog.animation_properties.included_bones.description',
		)}
		includedItemsColumnLable={translate('dialog.animation_properties.excluded_bones.title')}
		includedItemsColumnTooltip={translate(
			'dialog.animation_properties.excluded_bones.description',
		)}
		swapColumnsButtonTooltip={translate(
			'dialog.animation_properties.swap_columns_button.tooltip',
		)}
		availableItems={availableBones}
		bind:includedItems={excludedBones}
	/>
</div>

<style>
</style>
