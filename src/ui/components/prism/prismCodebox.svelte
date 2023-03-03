<script lang="ts">
	export let language: string | undefined
	export let code = ''

	const highlight = (code: string, language?: string) => {
		console.log(language)
		let grammar
		if (language) grammar = Prism.languages[language]
		// @ts-ignore
		return window.Prism.highlight(code, grammar || undefined)
	}
</script>

<div class="code">
	{@html highlight(code, language)}
</div>

<style>
	div {
		overflow: auto;
		white-space: pre-wrap;
	}
</style>
