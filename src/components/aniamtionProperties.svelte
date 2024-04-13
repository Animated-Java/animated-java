<script lang="ts" , context="module">
	import Checkbox from './dialogItems/checkbox.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import LineInput from './dialogItems/lineInput.svelte'

	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	import Select from './dialogItems/select.svelte'

	export let animationName: Valuable<string>
	export let loopMode: Valuable<string>

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
</div>

<style>
</style>
