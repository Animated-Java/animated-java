<script lang="ts">
	import type { IAnimatedJavaSetting } from '../../settings'
	import Overlay from './overlay.svelte'
	export let setting: IAnimatedJavaSetting<any>

	function onClick() {
		console.log('Setting question mark clicked!')
	}
</script>

<Overlay position={'bottom-left'} zIndex={10}>
	<button class="help-popup" on:click={onClick} slot="parent" let:open on:mouseenter={open}>
		?
	</button>
	<!-- let:close
	on:mouseleave={close} -->
	<div slot="content">
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
		position: relative !important;
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
		border-top: unset;
	}

	button.help-popup {
		all: unset !important;
		position: relative !important;
		background-color: var(--color-button) !important;
		padding: 10px !important;
		height: 10px !important;
		width: 10px !important;
		line-height: 10px !important;
		font-size: 20px !important;
	}

	button.help-popup:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>
