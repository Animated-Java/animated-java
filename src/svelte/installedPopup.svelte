<script lang="ts" context="module">
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
</script>

<div class="content-container">
	<div class="header-container">
		<!-- svelte-ignore a11y-missing-attribute -->
		<img src={AnimatedJavaIcon} />
		<div>
			<h1>Welcome to Animated Java!</h1>
			<h3>
				A Blockbench plugin that makes complex animation a breeze in Minecraft: Java
				Edition.
			</h3>
		</div>
	</div>
	<div class="another-container">
		<h2>Not Sure Where to Start?</h2>
		<p>
			Check out our <a
				href="https://animated-java.dev/docs/getting-started/creating-a-blueprint"
				>getting started</a
			> page to learn how to use Animated Java!
		</p>
		<p>
			You can open our docs at any time via the Animated Java menu at the top of the screen.
		</p>
		<h2>Need more help?</h2>
		<p>
			Feel free to join our <a href="https://animated-java.dev/discord">Discord server</a> to ask
			questions via our support channel.
		</p>
	</div>
</div>

<style>
	.another-container {
		display: flex;
		align-items: flex-start;
		flex-direction: column;
		padding: 0 10%;
	}

	.content-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	p {
		text-align: left;
	}

	h2 {
		text-align: center;
		margin-top: 2rem;
		/* color: var(--color-subtle_text); */
		font-weight: 500;
		border-bottom: 1px solid var(--color-accent);
		margin-bottom: 1rem;
	}

	.header-container {
		display: flex;
		align-items: center;
		margin-top: 1rem;
		justify-content: center;
	}
	.header-container div {
		display: flex;
		flex-direction: column;
		justify-content: center;
		margin-left: 2rem;
	}
	.header-container img {
		width: 128px;
		border-radius: 16px;
		box-shadow: 4px 4px 8px -4px black;
	}
	.header-container h1 {
		margin: 0px;
		border-bottom: 1px solid var(--color-accent);
		margin-bottom: 4px;
	}
	.header-container h3 {
		margin: 0px;
		color: var(--color-subtle_text);
		font-size: medium;
		max-width: 23rem;
	}
</style>
