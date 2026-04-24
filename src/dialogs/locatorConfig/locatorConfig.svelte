<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import CheckBox from '../../svelteComponents/dialogItems/checkbox.svelte'
	import CodeInput from '../../svelteComponents/dialogItems/codeInput.svelte'
	import LineInput from '../../svelteComponents/dialogItems/lineInput.svelte'
	import { getRegistryEntry } from '../../systems/minecraft/registryManager'
	import { localize as translate } from '../../util/lang'

	const entityTypeValidator: DialogItemValueChecker<string> = async (value: string) => {
		const itemRegistry = await getRegistryEntry(
			Project.animated_java.target_minecraft_version,
			'entity_type'
		)
		if (value.length === 0) {
			return {
				type: 'error',
				message: translate('dialog.locator_config.entity_type.error.empty'),
			}
		} else if (
			!(itemRegistry?.has(value) || itemRegistry?.has(value.replace(/^minecraft\:/, '')))
		) {
			return {
				type: 'warning',
				message: translate('dialog.locator_config.entity_type.warning.invalid'),
			}
		}
		return { type: 'success', message: '' }
	}
</script>

<script lang="ts">
	const PLUGIN_MODE = !!Project?.animated_java?.enable_plugin_mode

	export let useEntity: Observable<boolean>
	export let entityType: Observable<string>
	export let syncPassengerRotation: Observable<boolean>
	export let onSummonFunction: Observable<string>
	export let onRemoveFunction: Observable<string>
	export let onTickFunction: Observable<string>
</script>

<div class="locator-config">
	{#if PLUGIN_MODE}
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

			<CheckBox
				label={translate('dialog.locator_config.sync_passenger_rotation.title')}
				tooltip={translate('dialog.locator_config.sync_passenger_rotation.description')}
				bind:checked={syncPassengerRotation}
				defaultValue={false}
			/>

			<CodeInput
				label={translate('dialog.locator_config.on_summon_function.title')}
				tooltip={$useEntity
					? translate(
							'dialog.locator_config.on_summon_function.description_with_use_entity'
						)
					: translate('dialog.locator_config.on_summon_function.description')}
				bind:value={onSummonFunction}
				defaultValue=""
				syntax="mcfunction"
			/>

			<CodeInput
				label={translate('dialog.locator_config.on_remove_function.title')}
				tooltip={$useEntity
					? translate(
							'dialog.locator_config.on_remove_function.description_with_use_entity'
						)
					: translate('dialog.locator_config.on_remove_function.description')}
				bind:value={onRemoveFunction}
				defaultValue=""
				syntax="mcfunction"
			/>
		{/if}

		<CodeInput
			label={translate('dialog.locator_config.on_tick_function.title')}
			tooltip={$useEntity
				? translate('dialog.locator_config.on_tick_function.description_with_use_entity')
				: translate('dialog.locator_config.on_tick_function.description')}
			bind:value={onTickFunction}
			defaultValue=""
			syntax="mcfunction"
		/>
	{/if}
</div>

<style>
	.locator-config {
		max-height: 75vh;
		overflow-y: auto;
	}
</style>
