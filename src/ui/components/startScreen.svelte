<script lang="ts">
	import { ajModelFormat } from '../../modelFormat'

	function documentationOnClick() {
		AnimatedJava.docClick('/docs/home')
	}
	function gettingStartedOnClick() {
		AnimatedJava.docClick('/docs/getting_started')
	}
	function discordOnClick() {
		AnimatedJava.docClick('https://animated-java.dev/discord')
	}
	function githubOnClick() {
		AnimatedJava.docClick('https://github.com/Animated-Java/animated-java')
	}
	function createNewModelOnClick() {
		if (ajModelFormat.onStart) ajModelFormat.onStart()
		if (typeof ajModelFormat.new == 'function') ajModelFormat.new()
	}
</script>

<div class="container">
	<!-- svelte-ignore a11y-missing-attribute -->
	<h3>Good to know</h3>
	<div style="padding-left: 2em;">
		<ul class="markdown">
			<li>Model size is not limited by Java edition model constraints.</li>
			<li>
				Bone/Group rotation is not limited by Java edition model constraints, but Element
				rotation is.
			</li>
		</ul>
	</div>
	<h3>Resources</h3>
	<div style="padding-left: 2em;">
		<ul class="markdown">
			<li class="link" on:click={documentationOnClick} on:keydown={() => {}}>
				Documentation
			</li>
			<li class="link" on:click={gettingStartedOnClick} on:keydown={() => {}}>
				Getting Started
			</li>
			<li class="link" on:click={discordOnClick} on:keydown={() => {}}>Discord</li>
			<li class="link" on:click={githubOnClick} on:keydown={() => {}}>Github</li>
		</ul>
	</div>
	<div class="button_bar">
		<button
			id="create_new_model_button"
			style="margin-top:20px;"
			on:click={createNewModelOnClick}
			on:keydown={() => {}}
		>
			<i class="material-icons">arrow_forward</i>
			Create New Animated Java Rig
		</button>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-grow: 1;
		flex-direction: column;
	}
	.link {
		cursor: pointer;
		text-decoration: underline;
	}
	.link:hover {
		color: var(--color-light);
	}
</style>
