<script>
	export let language = 'none'
	export let code = ''
</script>

<div class="code">
	{@html window.Prism.highlight(code, window.Prism.languages[language])}
</div>

<style>
	div {
		overflow: auto;
		white-space: pre-wrap;
	}
</style>
