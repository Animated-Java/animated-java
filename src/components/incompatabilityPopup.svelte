<script lang="ts">
	import { closeIncompatabilityPopup } from '../interface/popup/incompatabilityPopup'
	import { translate } from '../util/translation'

	export let plugins: BBPlugin[]

	function disablePlugin(plugin: BBPlugin) {
		plugin.toggleDisabled()
		plugins.remove(plugin)
		plugins = [...plugins]
		if (plugins.length === 0) {
			closeIncompatabilityPopup()
		}
	}
</script>

<p>
	{@html translate('popup.incompatability_popup.description').replaceAll('\n', '<br />')}
</p>
<ul>
	{#each plugins as plugin}
		{#if !plugin.disabled}
			<li>
				{#if plugin.hasImageIcon()}
					<img src={plugin.getIcon()} alt="" />
				{/if}
				{plugin.title}
				<button on:click={() => disablePlugin(plugin)}>
					<i class="material-icons icon">bedtime</i>
					<!-- svelte-ignore missing-declaration -->
					{tl('dialog.plugins.disable')}
				</button>
			</li>
		{/if}
	{/each}
</ul>

<style>
	ul {
		display: flex;
		flex-direction: column;
		margin-top: 1rem;
		gap: 0.75rem;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		font-size: 24px;
		background: var(--color-back);
		padding: 12px;
	}
	img {
		width: 64px;
		margin-right: 16px;
	}
	button {
		margin-left: auto;
		font-size: 16px;
		height: 64px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: unset;
	}
	i {
		font-size: 32px;
		max-width: min-content;
	}
</style>
