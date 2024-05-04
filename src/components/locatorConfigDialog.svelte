<script lang="ts" , context="module">
	import CodeInput from './dialogItems/codeInput.svelte'

	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	const pluginModeEnabled = !!Project?.animated_java?.enable_plugin_mode

	export let tickingCommands: Valuable<string>
</script>

<div>
	{#if pluginModeEnabled}
		<CodeInput
			label={translate('dialog.locator_config.ticking_commands.title')}
			tooltip={translate('dialog.locator_config.ticking_commands.description')}
			bind:value={tickingCommands}
		/>
	{:else}
		<CodeInput
			label={translate('dialog.locator_config.ticking_commands.title')}
			tooltip={translate('dialog.locator_config.ticking_commands.description')}
			bind:value={tickingCommands}
		/>
	{/if}
</div>

<style>
</style>
