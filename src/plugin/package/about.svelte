<div class="blurb">
	<span
		>Do you wish your Vanilla Minecraft creations could move and animate like the ones in
		mods?&nbsp;</span
	>
	<span>Are you <i>tired</i> of Minecraft's&nbsp;</span>
	<span>
		{#each 'silly model limitations?'.split('') as letter, i}
			<span class="silly" style="animation-delay:{-5000 + i * 75}ms"
				>{@html letter === ' ' ? '&nbsp;' : letter}</span
			>
		{/each}
	</span>
	<span>&nbsp;Animated Java is here to help! </span>
</div>

<div
	style="
	display: flex;
	align-items: center;
	height: 64px;
	margin-top: 8px;
"
>
	<h1>Welcome to Animated Java!</h1>
	<img
		src="https://github.com/Animated-Java/animated-java/blob/main/src/assets/armor_stand_wave.webp?raw=true"
		alt="Armor Stand Waving"
		width="80px"
	/>
</div>

<p>
	Animated Java is a plugin for Blockbench that allows you to create custom animations and models
	for Vanilla Minecraft. It uses the power of Java Edition's Data Pack and Resource Pack systems
	to bring your creations to life!
</p>

<h3 class="animated-java-plugin-page-h3">Features</h3>

<ul>
	<li>Variants: Swap between different textures in-game.</li>
	<li>
		Highly optimized: Hours of performance tests and optimization tweaks have gone into Animated
		Java's Exported Data Pack to make sure it has as little performance impact as possible.
	</li>
	<li>Limited Molang support. If Blockbench can render it, Animated Java can animate it.</li>
	<li>Text Display previewing and animation support.</li>
	<li>Resource Pack-less exporting. Animate Vanilla block and item models!</li>
	<li>Locators: Run commands relative to a locators position via keyframes.</li>
	<li>
		Camera Plugin Support: Install the <a href="https://www.blockbench.net/plugins/cameras"
			>Official Camera Plugin</a
		> to create cinematic camera paths with ease!
	</li>
	<li>Animation Tweening: Create smooth transitions between animations.</li>
	<li>Many different configuration options.</li>
	<li>
		Complete Documentation at <a href="https://animated-java.dev/docs"
			>animated-java.dev/documentation/</a
		>
	</li>
	<li>And much more!</li>
</ul>

<h3 class="animated-java-plugin-page-h3">Getting started</h3>

<p>
	To learn the basics of Animated Java, check out our <a
		href="https://animated-java.dev/docs/getting-started/installing-animated-java"
		>Getting Started</a
	> guide.
</p>

<p class="note">
	<i
		>Note that it is <b>highly</b> recommended to have a basic understanding of Java Edition's Data
		Pack and Resource Pack systems before using Animated Java!</i
	>
</p>

<h3 class="animated-java-plugin-page-h3">Need Help?</h3>

<p>
	Check our <a href="https://animated-java.dev/docs">Documentation</a> to find answers to common
	questions or make a post in the
	<a href="https://discord.gg/adWuKnZD69">#animated-java-support</a> channel on our
	<a href="https://animated-java.dev/discord">Discord</a> server to get help from the community and
	developers.
</p>

<h3 class="animated-java-plugin-page-h3">Found a bug?</h3>

<p>
	If you find a bug, please report it on our <a href="https://animated-java.dev/source">GitHub</a
	>. It only takes a few moments of your time, and improves the quality of the project for
	everyone!
</p>

<style>
	h3 {
		border-bottom: 1px solid var(--color-accent);
	}
	li {
		margin: 0px;
	}
	.blurb {
		margin: 0px !important;
	}
	.note {
		font-size: 0.9em;
		color: var(--color-error);
	}
	@keyframes wave {
		0% {
			transform: translatey(-1px);
		}
		50% {
			transform: translatey(1px);
		}
		100% {
			transform: translatey(-1px);
		}
	}
	.silly {
		display: inline-block;
		animation: wave 1.5s infinite;
		animation-timing-function: ease-in-out;
	}
</style>
