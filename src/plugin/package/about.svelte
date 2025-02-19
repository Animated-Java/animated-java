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
	<li>
		<b>Function API</b> - Simple, yet powerful, API for summoning, and controlling animated models.
	</li>
	<li><b>Variants</b> - Swap between different textures in-game.</li>
	<li><b>Text Displays</b> - Preview, edit, and animate text displays in Blockbench.</li>
	<li><b>Keyframe Easing Curves</b> - Create smooth animations with ease.</li>
	<li>
		<b>Locators</b> - Execute commands using Command Keyframes, teleport entities in an animation,
		and more.
	</li>
	<li><b>Animation Tweening</b> - Smoothly transition between animations.</li>
	<li>
		<b>Camera Support</b> - Install the
		<a href="https://www.blockbench.net/plugins/cameras">Official Camera Plugin</a> to create cinematic
		camera paths with ease.
	</li>
	<li>
		<b>Well Optimized</b> - Hours of effort have been poured into making Animated Java's Data Pack
		as low-impact as possible.
	</li>
	<li>
		<b>Resource Packs are Optional</b> - Animate Vanilla block and item models using Item and Block
		Display entities.
	</li>
	<li>
		<b>Molang Support</b> - If Blockbench can render your Molang expressions in the preview, you
		can use it in Animated Java.
	</li>
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
