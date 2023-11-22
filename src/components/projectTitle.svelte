<script lang="ts" context="module">
	import { onDestroy } from 'svelte'
	// @ts-ignore
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
	// @ts-ignore
	import AnimatedPaperIcon from '../assets/animated_paper_icon.svg'
</script>

<script lang="ts">
	let pluginMode = false
	export let project: ModelProject

	const intervalID = setInterval(() => {
		if (Project !== project) return
		pluginMode = project.animated_java.enable_plugin_mode
	}, 250)

	onDestroy(() => {
		clearInterval(intervalID)
	})
</script>

{#if pluginMode}
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
		border-radius: 10px;
	}
</style>
