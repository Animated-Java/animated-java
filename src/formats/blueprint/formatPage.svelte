<script lang="ts">
	import { createNewBlueprintProject } from '.'
	import AnimatedJavaIcon from '../../assets/animated_java_icon.svg'
	import { localize as translate } from '../../util/lang'
</script>

<h2>
	<img src={AnimatedJavaIcon} alt="" />
	{translate('menubar.label') + ' ' + translate('format.blueprint.name')}
</h2>

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
	<button onclick={() => createNewBlueprintProject()}>
		<i class="material-icons">arrow_forward</i>
		Create new AJ Blueprint
	</button>
</div>

<style>
	h2 {
		font-weight: 400;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		margin-bottom: 16px;
	}
	button {
		width: 100%;
		height: 40px;
	}
	img {
		border-radius: 8px;
		height: 48px;
		box-shadow: 1px 1px 1px #000000aa;
		vertical-align: bottom;
		margin-right: 16px;
	}
</style>
