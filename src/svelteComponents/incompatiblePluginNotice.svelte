<script lang="ts" module>
	import { onDestroy } from 'svelte'
	import { isIncompatiblePlugin } from '../popups/incompatability/incompatability'
	import EVENTS from '../util/events'
	import { localize as translate } from '../util/lang'

	const getButton = (innerText: string) => {
		return jQuery(
			`.plugin_browser_page_header button:has(span:contains("${innerText}"))`
		)[0] as HTMLButtonElement | undefined
	}
</script>

<script lang="ts">
	interface Props {
		selectedPlugin: BBPlugin | null
	}

	let { selectedPlugin }: Props = $props()

	let isIncompatible = $derived(!!selectedPlugin && isIncompatiblePlugin(selectedPlugin))

	const updateButtons = () => {
		requestAnimationFrame(() => {
			const installButton = getButton(tl('dialog.plugins.install'))
			if (installButton) {
				installButton.disabled = isIncompatible ? true : false
				installButton.title = translate('plugin_dialog.incompatability_notice')
			}

			const enableButton = getButton(tl('dialog.plugins.enable'))
			if (enableButton) {
				enableButton.disabled = isIncompatible ? true : false
				enableButton.title = translate('plugin_dialog.incompatability_notice')
			}

			const uninstallButton = getButton(tl('dialog.plugins.uninstall'))
			if (uninstallButton) uninstallButton.disabled = false

			const disableButton = getButton(tl('dialog.plugins.disable'))
			if (disableButton) disableButton.disabled = false
		})
	}

	updateButtons()

	const UNSUBS = [
		EVENTS.EXTERNAL_PLUGIN_LOAD.subscribe(updateButtons),
		EVENTS.EXTERNAL_PLUGIN_UNLOAD.subscribe(updateButtons),
	]

	onDestroy(() => {
		UNSUBS.forEach(unsub => unsub())
	})
</script>

{#if isIncompatible}
	<div class="incompatible_plugin_notice">
		<i class="material-icons icon">warning</i>

		<div class="description">
			{@html pureMarked(translate('plugin_dialog.incompatability_notice'))}
		</div>
	</div>
{/if}

<style>
	:global(div.plugin_browser_page_header button:has(span):disabled) {
		opacity: 0.5 !important;
		cursor: not-allowed !important;
	}
	:global(div.plugin_browser_page_header > button:has(span):disabled:hover) {
		color: var(--color-subtle_text) !important;
		background-color: var(--color-ui) !important;
	}
	div.incompatible_plugin_notice {
		display: flex;
		flex-direction: row;
		color: var(--color-warning);
		font-size: 20px;
		border: 2px solid;
		background-color: var(--color-button);
		margin-top: 12px;
		padding: 4px;
	}
	i {
		margin: 5px;
	}
	div.description {
		display: flex;
		flex-direction: column;
		margin-left: 5px;
	}
</style>
