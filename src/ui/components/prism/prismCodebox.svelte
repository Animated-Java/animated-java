<script lang="ts">
	export let language: string | undefined
	export let code = ''

	const highlight = (code: string, language?: string) => {
		if (language === undefined || Prism.languages[language] === undefined) return code
		return Prism.highlight(code, Prism.languages[language], language)
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
