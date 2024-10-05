<script lang="ts" context="module">
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
	import AnimatedPaperIcon from '../assets/animated_paper_icon.svg'
	import { type ExportEnvironment } from '../blueprintSettings'
	import { Valuable } from '../util/stores'
</script>

<script lang="ts">
	export let environment: Valuable<ExportEnvironment>
</script>

{#if $environment === 'plugin'}
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
