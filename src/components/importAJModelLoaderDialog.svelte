<script lang="ts" context="module">
	import { convertAJModelToBlueprint } from '../interface/importAJModelLoader'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	function openAJModel() {
		void Promise.any([
			// @ts-ignore
			electron.dialog.showOpenDialog({
				properties: ['openFile'],
				filters: [{ name: '.ajmodel', extensions: ['ajmodel'] }],
				message: translate('action.upgrade_old_aj_model_loader.select_file'),
			}),
		]).then(result => {
			if (!result.canceled) {
				convertAJModelToBlueprint(result.filePaths[0] as string)
			}
		})
	}
</script>

<p>{translate('action.upgrade_old_aj_model_loader.body')}</p>

<button on:click={openAJModel}>
	{translate('action.upgrade_old_aj_model_loader.button')}
</button>

<style>
	button {
		width: 100%;
		height: 40px;
	}
</style>
