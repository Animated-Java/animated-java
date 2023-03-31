<script lang="ts">
	import CodeJar from '@novacbn/svelte-codejar/components/CodeJar.svelte'

	const highlight = (code: string, language?: string) => {
		if (language === undefined || Prism.languages[language] === undefined) return code
		return Prism.highlight(code, Prism.languages[language], language)
	}

	// @ts-ignore
	export let language: string | undefined
	export let code = ''
</script>

<div class="animated-java-prism-editor">
	<CodeJar syntax={language} bind:value={code} {highlight} />
</div>

{@html `<style>
	.animated-java-prism-editor {
		display: flex;
		flex-grow: 1;
	}
	.animated-java-prism-editor pre {
		margin: 3px 8px;
		padding: 0;
		flex-grow: 1;
		border-radius: unset;
		background: unset;
	}
</style>`}
