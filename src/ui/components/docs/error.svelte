<script lang="ts">
	import { translate } from '../../../util/translation'
	import TextAreaAutosize from '../textAreaAutosize.svelte'

	export let error: any
</script>

<div class="content">
	<div class="flex-column loading" style="flex-grow:1;">
		<h1>{translate('animated_java.dialog.documentation.error.failed_to_load.title')}</h1>
		{#each translate('animated_java.dialog.documentation.error.failed_to_load.description').split('\n') as line}
			<p>{line}</p>
		{/each}
		<br />
		<TextAreaAutosize value={error.stack} maxWidth={'680px'} maxHeight={'400px'} />
	</div>
</div>

<style>
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
</style>
