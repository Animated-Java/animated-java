<script lang="ts" context="module">
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
	import { translate } from '../util/translation'
</script>

<div class="title_wrapper">
	<img src={AnimatedJavaIcon} alt="" />
	<div class="dialog_title">{translate('dialog.blueprint_settings.title')}</div>
</div>

<style>
	.title_wrapper {
		display: flex;
		flex-direction: row;
	}

	img {
		all: unset;
		width: 22px;
		border-radius: 4px;
	}
</style>
