<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import CheckBox from '../../svelteComponents/dialogItems/checkbox.svelte'
	import CodeInput from '../../svelteComponents/dialogItems/codeInput.svelte'
	import { localize } from '../../util/lang'
</script>

<script lang="ts">
	const PLUGIN_MODE = !!Project?.animated_java?.enable_plugin_mode

	export let response: Observable<boolean>
	export let onSummonFunction: Observable<string>
	export let onInteractionFunction: Observable<string>
	export let onAttackFunction: Observable<string>
	export let onRemoveFunction: Observable<string>
	export let onTickFunction: Observable<string>
</script>

<div class="locator-config">
	{#if PLUGIN_MODE}
		{#each localize('dialog.interaction_config.plugin_mode_warning').split('\n') as line}
			<p>{line}</p>
		{/each}
	{:else}
		<CheckBox
			label={localize('dialog.interaction_config.response.title')}
			tooltip={localize('dialog.interaction_config.response.description')}
			bind:checked={response}
			defaultValue={false}
		/>

		<CodeInput
			label={localize('dialog.interaction_config.on_summon_function.title')}
			tooltip={localize('dialog.interaction_config.on_summon_function.description')}
			bind:value={onSummonFunction}
			defaultValue=""
			syntax="mcfunction"
		/>

		<CodeInput
			label={localize('dialog.interaction_config.on_interaction_function.title')}
			tooltip={localize('dialog.interaction_config.on_interaction_function.description')}
			bind:value={onInteractionFunction}
			defaultValue=""
			syntax="mcfunction"
		/>

		<CodeInput
			label={localize('dialog.interaction_config.on_attack_function.title')}
			tooltip={localize('dialog.interaction_config.on_attack_function.description')}
			bind:value={onAttackFunction}
			defaultValue=""
			syntax="mcfunction"
		/>

		<CodeInput
			label={localize('dialog.interaction_config.on_remove_function.title')}
			tooltip={localize('dialog.interaction_config.on_remove_function.description')}
			bind:value={onRemoveFunction}
			defaultValue=""
			syntax="mcfunction"
		/>

		<CodeInput
			label={localize('dialog.interaction_config.on_tick_function.title')}
			tooltip={localize('dialog.interaction_config.on_tick_function.description')}
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
