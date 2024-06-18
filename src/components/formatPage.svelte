<script lang="ts">
	import { BLUEPRINT_FORMAT } from '../blueprintFormat'

	function createBlueprint() {
		newProject(BLUEPRINT_FORMAT)
		requestAnimationFrame(() => {
			Project!.openSettings()
		})
	}
</script>

<p class="format_description">Create advanced animated models in Vanilla Java Edition</p>

<p class="format_target">
	<b>Target</b>:
	<span>Minecraft: Java Edition</span>
</p>

<h3 class="markdown">
	<p class="markdown">Good to know:</p>
</h3>
<ul class="markdown">
	<li class="markdown">
		The rotations of elements are limited to 22.5 degree steps, and only one axis can be rotated
		at a time. However, the rotation of bones is not restricted.
	</li>
	<li class="markdown">
		Documentation for Animated Java can be found at <a href="https://animated-java.dev/"
			>https://animated-java.dev/</a
		>
	</li>
</ul>

<div class="button_bar">
	<button on:click={() => createBlueprint()}>
		<i class="material-icons">arrow_forward</i>
		Create new AJ Blueprint
	</button>
</div>

<style>
	button {
		width: 100%;
		height: 40px;
	}
	li {
		margin-left: 24px;
	}
</style>
