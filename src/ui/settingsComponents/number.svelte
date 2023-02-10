<script lang="ts">
	import type { IAnimatedJavaSetting } from '../../settings'
	import HelpButton from './helpButton.svelte'
	export let setting: IAnimatedJavaSetting<any>
</script>

<div class="setting">
	<div class="flex">
		<input type="number" class="number" />
		<p>{setting.info.displayName}</p>
	</div>
	<HelpButton {setting} />
</div>

<style>
	.number {
		border: none;
		background: var(--color-button);
		display: inline-block;
		text-align: center;
		vertical-align: middle;
		cursor: default;
		outline: none;
		height: 32px;
		min-width: 100px;
		width: auto;
		color: var(--color-text);
		padding-right: 16px;
		padding-left: 16px;
		font-weight: normal;
		cursor: pointer;
	}

	p {
		display: inline-block;
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
