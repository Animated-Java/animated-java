<script lang="ts" context="module">
	import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
	import AnimatedJavaIconNoBackground from '../assets/animated_java_icon_no_background.svg'
	import { PACKAGE } from '../constants'
</script>

<div class="content">
	<div class="header-container">
		<!-- svelte-ignore a11y-missing-attribute -->
		<img src={AnimatedJavaIcon} />
		<div>
			<h1>Animated Java</h1>
			<h3>v{PACKAGE.display_version}</h3>
		</div>
	</div>

	<div class="socials">
		<a href="https://animated-java.dev" class="open-in-browser">
			<!-- svelte-ignore a11y-missing-attribute -->
			<img src={AnimatedJavaIconNoBackground} />
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>Website</label>
		</a>
		<a href="https://discord.com/invite/jFgY4PXZfp" class="open-in-browser"
			><i class="icon fab fa-discord" style="color: rgb(114, 127, 255);"></i>
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>Discord</label>
		</a>
		<a href="https://github.com/Animated-Java/animated-java" class="open-in-browser"
			><i class="icon fab fa-github" style="color: rgb(221, 221, 221);"></i>
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>GitHub</label>
		</a>
		<a href="https://animated-java.dev/docs" class="open-in-browser"
			><i class="icon fas fa-book"></i>
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>Wiki</label>
		</a>
	</div>

	<p>Created by Titus Evans (SnaveSutit)</p>
	<p
		style="
			color: var(--color-subtle_text);
			text-align: center;
		"
	>
		{PACKAGE.description}
	</p>

	<h4>Special Thanks to</h4>
	<div class="grid">
		<div>
			<p>Ian Senne (FetchBot)</p>
			<p>For always being there to help.</p>
		</div>
		<div>
			<p>Jesse Spicer (Dominexis)</p>
			<p>For making quaternions and matrices make sense.</p>
		</div>
		<div>
			<p>Jannis Petersen</p>
			<p>For creating an amazing tool and community.</p>
		</div>
		<div>
			<p>Ewan Howell</p>
			<p>For keeping me sane as I dig through Blockbench source code.</p>
		</div>
		<div>
			<p>Boxic</p>
			<p>For throwing absurd amounts of money at me.</p>
		</div>
		<div>
			<p>Flubberschnub</p>
			<p>For showing off the power of AJ with his boss fights.</p>
		</div>
	</div>

	<h4>Ko-fi Supporters</h4>
	<div class="grid2">
		{#each PACKAGE.subscription_supporters.sort() as special}
			<p>{special}</p>
		{/each}
	</div>

	<h4>Cool People who helped make AJ what it is today</h4>
	<div class="grid2">
		{#each PACKAGE.special_thanks.sort() as special}
			<p>{special}</p>
		{/each}
	</div>
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: scroll;
		max-height: 55rem;
		padding-right: 16px;
	}
	.header-container {
		display: flex;
		align-items: center;
		margin-bottom: 1.5rem;
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
	}
	.header-container h3 {
		margin: 0px;
	}

	h4 {
		color: var(--color-subtle_text);
		margin-top: 30px;
		border-top: 2px solid var(--color-border);
		padding-top: 12px;
		padding-bottom: 8px;
		text-transform: uppercase;
		text-align: center;
		width: 100%;
	}

	.socials {
		display: flex;
		justify-content: space-evenly;
		width: 100%;
		margin-bottom: 16px;
	}

	.socials a {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-decoration: none;
		width: 64px;
		height: 64px;
		padding: 8px;
		background-color: var(--color-button);
		border-radius: 8px;
	}

	.socials a:hover {
		background-color: var(--color-selected);
	}

	.socials a *:not(label) {
		flex-grow: 1;
	}

	.socials a label {
		color: var(--color-subtle_text);
	}

	.socials a i {
		display: flex;
		align-items: center;
		font-size: 2em;
	}

	.socials img {
		width: 32px;
		height: 32px;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		grid-gap: 0.75rem;
		justify-items: center;
	}

	.grid p {
		text-align: center;
	}
	.grid p:nth-child(even) {
		color: var(--color-subtle_text);
	}

	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		justify-items: center;
		gap: 4px 8px;
		margin-bottom: 8px;
	}

	.grid2 p {
		text-align: center;
		width: 100%;
		box-shadow: 2px 2px 4px var(--color-back);
		background: var(--color-button);
		padding: 0px 4px;
		border-radius: 4px;
	}
</style>
