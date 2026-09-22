<script lang="ts" module>
	import AnimatedJavaIcon from '../../assets/animated_java_icon.svg'
	import HeartIcon from '../../assets/heart.png'
	import KoFiImage from '../../assets/kofi_tag_white.webp'
	import { PACKAGE } from '../../constants'
</script>

<div class="content">
	<div class="header">
		<div class="logo-wrapper">
			<!-- svelte-ignore a11y_missing_attribute -->
			<img src={AnimatedJavaIcon} />
		</div>
		<div class="header-text">
			<div class="title-row">
				<h1>Animated Java</h1>
				<span class="version">v{PACKAGE.version}</span>
			</div>
			<p class="tagline">{PACKAGE.description}</p>
		</div>
	</div>

	<div class="socials">
		<a href="https://animated-java.dev" class="open-in-browser">
			<i class="icon fas fa-globe" style="color: #00ACED;"></i>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label>Website</label>
		</a>
		<a href="https://discord.com/invite/jFgY4PXZfp" class="open-in-browser">
			<i class="icon fab fa-discord" style="color: #727FFF;"></i>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label>Discord</label>
		</a>
		<a href="https://github.com/Animated-Java/animated-java" class="open-in-browser">
			<i class="icon fab fa-github" style="color: #DDDDDD;"></i>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label>GitHub</label>
		</a>
		<a href="https://animated-java.dev/docs" class="open-in-browser">
			<i class="icon fas fa-book"></i>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label>Wiki</label>
		</a>
	</div>

	<p class="author">Created by Titus Evans (SnaveSutit)</p>

	<h4>Special Thanks to</h4>
	<div class="grid">
		<div class="card">
			<p>Ian Senne (FetchBot)</p>
			<p>For always being there to help.</p>
		</div>
		<div class="card">
			<p>Jesse Spicer (Dominexis)</p>
			<p>For making quaternions and matrices make sense.</p>
		</div>
		<div class="card">
			<p>Jannis Petersen</p>
			<p>For creating an amazing tool and community.</p>
		</div>
		<div class="card">
			<p>Ewan Howell</p>
			<p>For keeping me sane as I dig through Blockbench source code.</p>
		</div>
		<div class="card">
			<p>Boxic</p>
			<p>For throwing absurd amounts of money at me.</p>
		</div>
		<div class="card">
			<p>Flubberschnub</p>
			<p>For showing off the power of AJ with his boss fights.</p>
		</div>
	</div>

	<h4>Ko-fi Supporters</h4>
	<div class="chips supporter-chips">
		{#each PACKAGE.subscription_supporters.sort() as special}
			<span><i class="fas fa-heart"></i>{special}</span>
		{/each}
	</div>

	<a href="https://ko-fi.com/snavesutit" class="ko-fi-banner">
		<div class="row">
			<img class="heart" src={HeartIcon} alt="❤️" /><span>Animated Java?</span>
		</div>
		<img src={KoFiImage} alt="Ko-fi" />
	</a>

	<h4>Cool People who helped make AJ what it is today</h4>
	<div class="chips">
		{#each PACKAGE.special_thanks.sort() as special}
			<span>{special}</span>
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

	.header {
		display: flex;
		align-items: center;
		gap: 28px;
		margin-bottom: 1.75rem;
	}
	.logo-wrapper {
		position: relative;
		flex-shrink: 0;
	}
	.logo-wrapper img {
		position: relative;
		z-index: 1;
		width: 112px;
		border-radius: 18px;
		box-shadow:
			4px 4px 8px -4px black,
			0 0 0 1px var(--color-border);
	}
	.title-row {
		display: flex;
		gap: 10px;
		align-items: center;
		justify-content: space-between;
	}
	.title-row h1 {
		margin: 0px;
		font-weight: 600;
	}
	.version {
		font-size: 0.75em;
		color: var(--color-accent_text);
		background-color: var(--color-accent);
		padding: 0px 8px;
		border-radius: 12px;
	}
	.tagline {
		margin: 6px 0 0;
		color: var(--color-subtle_text);
	}

	h4 {
		position: relative;
		color: var(--color-subtle_text);
		padding-top: 12px;
		padding-bottom: 8px;
		text-transform: uppercase;
		text-align: center;
		width: 100%;
		border-top: 1px solid var(--color-border);
	}

	.socials {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		gap: 8px;
		margin-bottom: 16px;
		width: 75%;
	}
	.socials a {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		padding: 12px 8px 10px;
		border-radius: 8px;
		transition:
			background-color 120ms ease,
			transform 120ms ease;
	}
	.socials a:hover {
		background-color: var(--color-accent);
		transform: translateY(-2px);
	}
	.socials a i {
		font-size: 1.7em;
	}
	.socials a label {
		color: var(--color-subtle_text);
		cursor: inherit;
	}
	.socials a:hover i,
	.socials a:hover label {
		color: var(--color-accent_text);
	}

	.ko-fi-banner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		margin-top: 20px;
		padding: 14px 16px;
		background-color: #00aced;
		border-radius: 8px;
		text-decoration: none;
		transition: transform 120ms ease;
	}
	.ko-fi-banner:hover {
		transform: translateY(-2px);
	}
	.ko-fi-banner span {
		color: white;
		text-align: center;
		font-size: 24px;
		font-family: 'MinecraftFull';
	}
	.ko-fi-banner img {
		image-rendering: auto;
		width: 270px;
	}
	.ko-fi-banner .row {
		display: flex;
		align-items: center;
		flex-direction: row;
		width: 100%;
		justify-content: center;
	}
	.ko-fi-banner .heart {
		width: 28px;
		height: 28px;
		animation: heartbeat 2s ease infinite;
		image-rendering: pixelated;
		margin-right: 16px;
	}
	@keyframes heartbeat {
		0% {
			transform: scale(1);
		}
		10% {
			transform: scale(1.2);
		}
		20% {
			transform: scale(1);
		}
	}
	.author {
		color: var(--color-subtle_text);
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 10px;
		width: 100%;
	}
	.grid .card {
		background-color: var(--color-back);
		border-radius: 8px;
		padding: 10px 12px;
		text-align: center;
		transition:
			background-color 120ms ease,
			transform 120ms ease;
	}
	.grid .card:hover {
		background-color: var(--color-button);
		transform: translateY(-2px);
	}
	.grid .card p {
		margin: 0;
	}
	.grid .card p:first-child {
		font-weight: 500;
	}
	.grid .card p:last-child {
		margin-top: 4px;
		color: var(--color-subtle_text);
		font-size: 0.88em;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
		width: 100%;
		margin-bottom: 8px;
	}
	.chips span {
		background-color: var(--color-back);
		padding: 3px 10px;
		border-radius: 12px;
		font-size: 0.9em;
	}

	.supporter-chips span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
		box-shadow: 0 0 0 1px rgba(255, 94, 91, 0.45);
		transition:
			transform 120ms ease,
			box-shadow 120ms ease;
	}
	.supporter-chips span:hover {
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 0 0 1px #ff5e5b,
			0 3px 8px -2px rgba(255, 94, 91, 0.7);
	}
	.supporter-chips i {
		color: #ff5e5b;
		font-size: 0.85em;
	}
</style>
