<script lang="ts" module>
	import { BlueprintSettings } from '@aj/formats/ajblueprint/settings'
	import { createScopedTranslator } from '@aj/util/lang'
	import type { Syncable } from '@aj/util/stores'
	import Checkbox from '@components/sidebar-dialog/checkbox.svelte'

	const localize = createScopedTranslator('dialog.blueprint_settings')
</script>

<script lang="ts">
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
		label={localize('show_render_box.label')}
		description={localize('show_render_box.description')}
		value={generalSettings.showRenderBox}
	/>

	<Checkbox
		label={localize('auto_render_box.label')}
		description={localize('auto_render_box.description')}
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
