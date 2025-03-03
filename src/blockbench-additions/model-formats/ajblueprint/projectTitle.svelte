<script lang="ts">
	import AnimatedJavaIcon from '@assets/icons/animated_java_icon.svg'
	import AnimatedPaperIcon from '@assets/icons/animated_paper_icon.svg'
	import { Syncable } from '../../../util/stores'

	export let pluginMode: Syncable<boolean>
</script>

{#if $pluginMode}
	<img src={AnimatedPaperIcon} alt="" />
{:else}
	<img src={AnimatedJavaIcon} alt="" />
{/if}

<style>
	img {
		width: 20px;
		height: 20px;
		margin-top: 2px;
		margin-right: 2px;
		border-radius: 2px;
		box-shadow: 1px 1px 1px #000000aa;
	}
</style>
