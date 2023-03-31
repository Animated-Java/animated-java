<script lang="ts">
	import PrismEditor from './prismEditor.svelte'

	export let language: string
	export let code: string
</script>

<div class="content">
	<PrismEditor {code} {language} />
</div>

<style>
	div.content {
		overflow: auto;
		max-height: 40em;
	}
</style>
