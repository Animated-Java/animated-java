<script lang="ts" module>
	import { openAJModel } from '.'
	import { localize as translate } from '../../util/lang'
</script>

<h2>
	{translate('dialog.upgrade_old_aj_model_loader.title')}
</h2>

<p>{translate('action.upgrade_old_aj_model_loader.body')}</p>

<div class="button_bar">
	<button onclick={openAJModel}>
		{translate('action.upgrade_old_aj_model_loader.button')}
	</button>
</div>

<style>
	button {
		width: 100%;
		height: 40px;
	}
</style>
