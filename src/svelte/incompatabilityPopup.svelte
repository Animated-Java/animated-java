<script lang="ts">
	import { closeIncompatabilityPopup } from '../interface/popup/incompatabilityPopup'
	import { translate } from '../util/translation'

	export let plugins: BBPlugin[]

	let disabledPlugins: BBPlugin[] = []

	function disablePlugin(plugin: BBPlugin) {
		plugin.toggleDisabled()
		plugins.remove(plugin)
		disabledPlugins.push(plugin)
		disabledPlugins = disabledPlugins
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
		<li>
			{#if plugin.hasImageIcon()}
				<img src={plugin.getIcon()} alt="" />
			{/if}
			{plugin.title}
			{#key disabledPlugins}
				{#if !disabledPlugins.includes(plugin)}
					<button on:click={() => disablePlugin(plugin)}>
						<i class="material-icons icon">bedtime</i>
						{translate('popup.incompatability_popup.disable_button')}
					</button>
				{/if}
			{/key}
		</li>
	{/each}
</ul>

<style>
	ul {
		margin-top: 1em;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		font-size: 24px;
		margin-bottom: 16px;
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
	}
	i {
		font-size: 32px;
		max-width: min-content;
	}
</style>
