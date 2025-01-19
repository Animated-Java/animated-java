<script lang="ts" context="module">
	import { translate } from '../util/translation'

	const flavorQuotes = [
		`Uh oh!`,
		`Time to fire up the ol' debugger!`,
		`Your item displays are sad 🥺`,
		`Ok, who pushed the big <span style="color: var(--color-error)">red</span> button?`,
		`Skill Issue.`,
		`You have how many elements!?`,
		`I'll export successfully some day!`,
		`When I grow up, I wanna be just like Blender!`,
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
		`<div style="display: flex; flex-direction: column; padding: 16px;">
			<p>SnaveSutit would like to know your location</p>
			<div style="display: flex; flex-direction: row; align-items: center; justify-content: center;">
				<button style="font-size: 1rem; margin: 0px 4px;">Allow</button>
				<button style="font-size: 1rem; margin: 0px 4px;">Deny</button>
			</div>
		</div>`,
		`I've decided to stop working for today. Try again tomorrow!`,
		`Every time you see this error message, a developer vanishes in a puff of binary.`,
		`"Flavor Text"? I've never tasted text before...`,
		`( ͡° ͜ʖ ͡°)`,
		`That's a nice model you have there, it'd be a shame if something were to happen to it...`,
		`Some day you'll learn. But until then, I control the cheese`,
		`Please deposit 5 coins!`,
		`<a href="https://youtu.be/dQw4w9WgXcQ">Click here to find a solution!</a>`,
		`<img src="https://i.kym-cdn.com/photos/images/original/000/296/199/9ff.gif" alt="roflcopter">`,
		`Failed to find global 'pandemic'`,
	]

	function pickRandomFlavorQuote() {
		return flavorQuotes[Math.floor(Math.random() * flavorQuotes.length)]
	}
</script>

<script lang="ts">
	export let error: Error

	let value = error.message + '\n' + (error.stack || '')

	function copyError() {
		navigator.clipboard.writeText(value)
		Blockbench.showQuickMessage(
			translate('dialog.unexpected_error.copy_error_message_button.message'),
		)
	}
</script>

<div class="container">
	<div class="quote">
		<i class="fas fa-quote-left dialog_form_warning text_icon" />
		<h2 style="font-size: 24px; text-align: center;">{@html pickRandomFlavorQuote()}</h2>
		<i class="fas fa-quote-right dialog_form_warning text_icon" />
	</div>
	<p>
		{@html translate(
			'dialog.unexpected_error.paragraph',
			'<a href="https://animated-java.dev/discord">Discord</a>',
			'<a href="https://github.com/Animated-Java/animated-java/issues">Github</a>',
		)}
	</p>
	<div class="codebox dark_bordered">
		<textarea bind:value readonly />
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i
			class="fas fa-copy dialog_form_warning text_icon"
			title={translate('dialog.unexpected_error.copy_error_message_button.description')}
			on:click={copyError}
		/>
	</div>
</div>

<style>
	.container {
		height: 25rem;
		display: flex;
		flex-direction: column;
	}
	.codebox {
		height: 25rem;
		display: flex;
		margin-top: 16px;
	}
	.quote {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 1rem;
	}
	textarea {
		width: 100%;
		height: 100%;
		border: unset;
	}
	i {
		cursor: pointer;
		padding: 5px;
		max-height: 2rem;
	}
	i:hover {
		color: var(--color-light);
	}
</style>
