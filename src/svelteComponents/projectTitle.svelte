<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
	import AnimatedPaperIcon from '../assets/animated_paper_icon.svg'
</script>

<script lang="ts">
	interface Props {
		pluginMode: Observable<boolean>
	}

	let { pluginMode }: Props = $props()
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
