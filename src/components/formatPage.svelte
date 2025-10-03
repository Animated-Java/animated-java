<script lang="ts">
	import { createNewBlueprintProject } from '../formats/blueprint/format'
</script>

<p class="format_description">Create advanced animated models for Vanilla Java Edition</p>

<p class="format_target">
	<b>Target</b>:
	<span>Minecraft: Java Edition</span>
</p>

<h3 class="markdown">
	<p class="markdown">Getting Started</p>
</h3>

<p>
	<a href="https://animated-java.dev/docs/getting-started/creating-a-blueprint"
		>Check out the Docs</a
	> to learn how to use Animated Java.
</p>

<div class="button_bar">
	<button on:click={() => createNewBlueprintProject()}>
		<i class="material-icons">arrow_forward</i>
		Create new AJ Blueprint
	</button>
</div>

<style>
	button {
		width: 100%;
		height: 40px;
	}
</style>
