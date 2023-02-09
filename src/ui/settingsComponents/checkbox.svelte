<script lang="ts">
	import Overlay from './overlay.svelte'
	import type { IAnimatedJavaSetting } from '../../settings'
	export let setting: IAnimatedJavaSetting<'boolean'>

	console.log('aaa', Overlay)
	function onClick() {
		console.log('Setting question mark clicked!')
	}
</script>

<div class="setting">
	<div class="flex">
		<input type="checkbox" />
		<p>{setting.info.displayName}</p>
	</div>
	<Overlay position={'right-center'}>
		<button
			class="help-popup"
			on:click={onClick}
			slot="parent"
			let:open
			let:close
			on:mouseenter={open}
			on:mouseleave={close}>?</button
		>

		<div slot="content" style=" position: relative;">
			<p class="popup">{setting.info.description}</p>
		</div>
	</Overlay>
</div>

<style>
	p {
		display: inline-block;
	}

	.popup {
		background-color: var(--color-back);
		margin: 10px;
		padding: 10px;
		outline: solid !important;
		outline-color: var(--color-bright_border) !important;
		outline-width: 1px !important;
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
		text-align: center;
	}

	button.help-popup:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}

	div.setting {
		display: flex;
		align-items: center;
		padding: 10px;
		position: relative;
		justify-content: space-between;
	}

	div.setting:nth-child(odd) {
		background-color: var(--color-back);
	}

	div.flex {
		display: flex;
		align-items: center;
	}
</style>
