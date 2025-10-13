<script lang="ts" context="module">
	import { openAJModel } from '.'
	import { translate } from '../../util/translation'
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
