<script lang="ts">
	import CheckBox from '@svelte-components/dialog-items/checkbox.svelte'
	import CodeInput from '@svelte-components/dialog-items/codeInput.svelte'
	import LineInput from '@svelte-components/dialog-items/lineInput.svelte'

	import { MINECRAFT_REGISTRY } from '@aj/systems/minecraft-temp/registryManager'
	import { Valuable } from '../../../util/stores'
	import { translate } from '../../../util/translation'

	const IS_PLUGIN_MODE = Project?.animated_java?.environment === 'plugin'

	export let useEntity: Valuable<boolean>
	export let entityType: Valuable<string>
	export let summonCommands: Valuable<string>
	export let tickingCommands: Valuable<string>

	const entityTypeValidator: DialogItemValueChecker<string> = (value: string) => {
		if (value.length === 0) {
			return {
				type: 'error',
				message: translate('dialog.locator_config.entity_type.error.empty'),
			}
		} else if (
			!(
				MINECRAFT_REGISTRY.entity_type?.has(value) ||
				MINECRAFT_REGISTRY.entity_type?.has(value.replace(/^minecraft\:/, ''))
			)
		) {
			return {
				type: 'warning',
				message: translate('dialog.locator_config.entity_type.warning.invalid'),
			}
		}
		return { type: 'success', message: '' }
	}
</script>

<div>
	{#if IS_PLUGIN_MODE}
		{#each translate('dialog.locator_config.plugin_mode_warning').split('\n') as line}
			<p>{line}</p>
		{/each}
	{:else}
		<CheckBox
			label={translate('dialog.locator_config.use_entity.title')}
			tooltip={translate('dialog.locator_config.use_entity.description')}
			bind:checked={useEntity}
			defaultValue={false}
		/>

		{#if $useEntity}
			<LineInput
				label={translate('dialog.locator_config.entity_type.title')}
				tooltip={translate('dialog.locator_config.entity_type.description')}
				bind:value={entityType}
				valueChecker={entityTypeValidator}
				defaultValue="minecraft:item_display"
			/>

			<CodeInput
				label={translate('dialog.locator_config.summon_commands.title')}
				tooltip={translate('dialog.locator_config.summon_commands.description')}
				bind:value={summonCommands}
				defaultValue=""
			/>
		{/if}

		<CodeInput
			label={translate('dialog.locator_config.ticking_commands.title')}
			tooltip={translate('dialog.locator_config.ticking_commands.description')}
			bind:value={tickingCommands}
			defaultValue=""
		/>
	{/if}
</div>

<style>
</style>
