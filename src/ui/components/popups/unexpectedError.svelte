<script lang="ts" context="module">
	Prism.languages.error = {
		error: {
			pattern: /^Error:/,
		},
	}

	const errorMessages = [
		`Uh oh!`,
		`Time to fire up the ol' debugger!`,
		`Your armor stands are sad 🥺`,
		`Ok, who pushed the big <span style="color: var(--color-error)">red</span> button?`,
		`Skill Issue.`,
		`Too bad, So Sad`,
		`You have how many elements!?`,
		`I'll export successfully some day!`,
		`When I grow up, I wanna be just like Blender!`,
		`Wow, Epic fail.`,
		`Should'a seen that one comming...`,
		`It's all Jannis' fault! :(`,
		`Snaviewavie did an oopsie poopsie x3`,
		`We to a little trolling`,
		`execute run execute run execute run execute run say This is fine.`,
		`This is why we can't have nice things. :(`,
		`Have you tried turning it off and on again?`,
		`What if I put my command block next to yours? Haha just kidding... Unless?`,
		`If at first you don't succeed, Try, try again!`,
		`B:01010111 01100101 00100000 01100100 01101111 00100000 01100001 00100000 01101100 01101001 01110100 01110100 01101100 01100101 00100000 01110100 01110010 01101111 01101100 01101100 01101001 01101110 01100111`,
		`SnaveSutit would like to know your location: [Allow] [Deny]`,
		`I've decided to stop working for today. Try again tomorrow!`,
		`Every time you see this error message, a developer vanishes in a puff of binary.`,
		`"Flavor Text"? I've never tasted text before...`,
		`&lt;Access Denied&gt;`,
		`( ͡° ͜ʖ ͡°)`,
		`.;,,,;.`,
		`That's a nice model you have there, it'd be a shame if something were to happen to it...`,
		`Some day you'll learn. But until then, I control the cheese`,
		`Please deposit 5 coins!`,
		`<a href="https://youtu.be/dQw4w9WgXcQ">Click here to find a solution!</a>`,
		`<img src="https://i.kym-cdn.com/photos/images/original/000/296/199/9ff.gif" alt="roflcopter">`,
		`Failed to find global 'pandemic'`,
	]
</script>

<script lang="ts">
	import { fade } from 'svelte/transition'

	import { translate } from '../../../util/translation'
	import PrismCodebox from '../prism/prismCodebox.svelte'
	const openLink = Blockbench.openLink
	export let error: any

	let loaded = false

	requestAnimationFrame(() => {
		loaded = true
	})
</script>

<div class="content">
	<div class="flex-column loading" style="flex-grow:1;">
		<h1 style="margin-bottom: 0;">{translate('animated_java.popup.unexpectedError.title')}</h1>
		{#if loaded}
			<h6 style="margin: 0 0 10px 0;" in:fade={{ delay: 500, duration: 1000 }}>
				{@html errorMessages[Math.floor(Math.random() * errorMessages.length)]}
			</h6>
		{/if}
		{#each translate('animated_java.popup.unexpectedError.body').split('\n') as line}
			<p>{line}</p>
		{/each}
		<div style="display: flex; margin-bottom: 5px;">
			<div
				class="icon"
				on:click={() => openLink('https://github.com/Animated-Java/animated-java')}
				on:keypress={() => openLink('https://github.com/Animated-Java/animated-java')}
			>
				<i class="fa-brands fa-github" />
			</div>
			<div
				class="icon"
				on:click={() => openLink('https://animated-java.dev/discord')}
				on:keypress={() => openLink('https://animated-java.dev/discord')}
			>
				<i class="fa-brands fa-discord" />
			</div>
		</div>
		<br />
		<div class="prism-container">
			<PrismCodebox language="error" code={error.stack} />
		</div>
	</div>
</div>

<style>
	h6 {
		font-style: italic;
		opacity: 0.76;
		font-size: 0.9em;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 32px;
		width: 32px;
		color: var(--color-text);
		font-size: 1.2em;
	}
	.icon:hover {
		color: var(--color-light);
	}

	p {
		margin: 0px;
	}

	div.flex-column {
		display: flex;
		align-items: center;
		flex-direction: column;
	}

	div.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	div.content {
		display: flex;
		overflow-y: scroll;
		max-height: 700px;
	}

	div.prism-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		flex-grow: 1;

		background-color: var(--color-back);
		border: 2px solid var(--color-border);
		border-radius: 0.25em;
		text-align: start;

		max-height: 20em;
		max-width: 580px;
		padding: 3px 8px;
	}
</style>
