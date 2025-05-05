<script lang="ts">
	import { flavorQuotes } from '.'
	import { translate } from '../../../util/translation'

	function pickRandomFlavorQuote() {
		return flavorQuotes[Math.floor(Math.random() * flavorQuotes.length)]
	}

	export let error: Error

	let value = error.message + '\n' + (error.stack ?? '')

	async function copyError() {
		await navigator.clipboard.writeText(value)
		Blockbench.showQuickMessage(
			translate('dialog.unexpected_error.copy_error_message_button.message')
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
			'<a href="https://github.com/Animated-Java/animated-java/issues">Github</a>'
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
