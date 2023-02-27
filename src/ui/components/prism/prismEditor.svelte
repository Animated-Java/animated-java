<script lang="ts">
	import CodeJar from '@novacbn/svelte-codejar/components/CodeJar.svelte'

	const highlight = (code: string, language?: string) => {
		// @ts-ignore
		return Prism.highlight(code, language ? Prism.languages[language] : undefined)
	}

	// @ts-ignore
	export let language = 'none'
	export let code = ''
</script>

<div class="this">
	<CodeJar syntax={language} bind:value={code} {highlight} />
</div>

{@html `<style>
	.this {
		display: flex;
		flex-grow: 1;
	}
	.this pre {
		margin: 3px 8px;
		padding: 0;
		flex-grow: 1;
		border-radius: unset;
	}
</style>`}
