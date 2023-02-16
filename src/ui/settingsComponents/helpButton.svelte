<script lang="ts">
	import { fly } from 'svelte/transition'
	import type * as Settings from '../../settings'
	import Overlay from './overlay.svelte'
	export let setting: Settings.Setting<any, any>

	function onClick() {
		console.log('Setting question mark clicked!')
	}
</script>

<Overlay position={'bottom-left'} zIndex={10}>
	<button
		class="help-popup"
		on:click={onClick}
		slot="parent"
		let:open
		on:mouseenter={open}
		let:close
		on:mouseleave={close}
	>
		?
	</button>
	<div slot="content" transition:fly={{ y: -10, duration: 500 }}>
		<div class="popup">
			{#each setting.info.description as line}
				<p class="setting-description">{line}</p>
			{/each}
		</div>
	</div>
</Overlay>

<style>
	.setting-description {
		color: var(--color-text);
	}

	.popup {
		display: flex;
		flex-direction: column;
		background-color: var(--color-dark);
		margin: 10px;
		padding: 10px;
		width: 492px;
		position: relative;
		left: 20px;
		border-color: var(--color-bright_border);
		border-width: 1px;
		border-style: solid;
		/* border-top: unset; */
	}

	button.help-popup {
		all: unset !important;
		position: relative !important;
		background-color: var(--color-button) !important;
		padding: 11px !important;
		height: 10px !important;
		width: 10px !important;
		line-height: 10px !important;
		font-size: 20px !important;
		margin-left: 10px !important;
	}

	button.help-popup:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>
