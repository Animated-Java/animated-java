<script lang="ts">
	import Icon from '@aj/assets/icons/animated-java-icon.svg'
	import { localize } from '@aj/util/lang'
</script>

<div class="container">
	<!-- svelte-ignore a11y_missing_attribute -->
	<img src={Icon} />
	<div class="dialog_title dialog-title-mod">
		{localize('dialog.blueprint_settings.title')}
	</div>
</div>

<style>
	.container {
		display: flex;
		margin-left: 5px;
	}
	.dialog-title-mod {
		padding-left: 8px;
	}
	img {
		height: 24px;
		border-radius: 4px;
		margin-top: 3px;
	}
</style>
