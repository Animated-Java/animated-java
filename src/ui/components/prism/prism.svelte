<script>
	export let language = 'none'
	export let code = ''
</script>

<div class="code">
	{@html window.Prism.highlight(code, window.Prism.languages[language])}
</div>

<style>
	.code {
		white-space: pre-wrap;
	}
</style>
