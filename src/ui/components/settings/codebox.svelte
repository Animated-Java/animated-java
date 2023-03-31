<script lang="ts">
	import SettingContainer from '../settingContainer.svelte'
	import PrismEditor from '../prism/prismEditor.svelte'
	import type * as AJ from '../../../settings'

	export let setting: AJ.CodeboxSetting
</script>

<SettingContainer {setting}>
	<div slot="beneath" class="prism-wrapper">
		<PrismEditor language={setting.language} bind:code={setting.value} />
	</div>
</SettingContainer>

<style>
	div.prism-wrapper {
		font-family: var(--font-code);
		flex-grow: 1;
		margin-top: 10px;
		background-color: var(--color-button);
	}
</style>
