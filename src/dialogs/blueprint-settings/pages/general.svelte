<script lang="ts">
	import { BlueprintSettings } from '@aj/formats/ajblueprint/settings'
	import { translate } from '@aj/util/lang'
	import type { Syncable } from '@aj/util/stores'
	import Checkbox from '@components/sidebar-dialog/checkbox.svelte'

	type GeneralSettings = Pick<
		BlueprintSettings,
		| 'exportEnvironment'
		| 'targetMinecraftVersion'
		| 'id'
		| 'tagPrefix'
		| 'autoGenerateTagPrefix'
		| 'showRenderBox'
		| 'autoRenderBox'
		| 'renderBoxWidth'
		| 'renderBoxHeight'
	>
	interface Props {
		generalSettings: {
			[K in keyof GeneralSettings]: Syncable<GeneralSettings[K]>
		}
	}
	const { generalSettings }: Props = $props()
</script>

<div>
	<Checkbox
		label={translate('config.blueprint-settings.show-render-box.label')}
		description={translate('config.blueprint-settings.show-render-box.description')}
		value={generalSettings.showRenderBox}
	/>

	<Checkbox
		label={translate('config.blueprint-settings.auto-render-box.label')}
		description={translate('config.blueprint-settings.auto-render-box.description')}
		value={generalSettings.autoRenderBox}
	/>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
