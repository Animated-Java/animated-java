<script lang="ts">
	export let value = ''
	export let minRows: number = 1
	export let maxRows: number | undefined = undefined

	$: minHeight = `${1 + minRows * 1.2}em`
	$: maxHeight = maxRows ? `${1 + maxRows * 1.2}em` : `auto`
</script>

<div class="container">
	<pre aria-hidden="true" style="min-height: {minHeight}; max-height: {maxHeight}">
	{value + '\n'}
	</pre>

	<textarea bind:value />
</div>

<style>
	.container {
		position: relative;
	}

	pre,
	textarea {
		font-family: var(--font-code);
		box-sizing: border-box;
		line-height: 1.2;
		overflow: hidden;
	}

	textarea {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		resize: none;
		padding-left: 8px;
		padding-right: 8px;
	}
</style>
