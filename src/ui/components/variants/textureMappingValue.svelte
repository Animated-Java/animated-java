<script lang="ts">
	export let value: number = 0
	export let options: Texture[]
	export let locked: boolean = false
	console.log(value)
</script>

<div class="container">
	{#key value}
		<img src={options[value].img.src} alt="" title={options[value].name} />
	{/key}
	<select bind:value disabled={locked}>
		{#each options as option, index}
			<option value={index}>
				{option.name}
			</option>
		{/each}
	</select>
</div>

<style>
	div.container {
		display: flex;
		align-items: stretch;
		width: 100%;
		margin: 0.5em;
		background-color: var(--color-button);
		position: relative;
		height: 46px;
	}
	img {
		height: 30px;
		width: 30px;
		margin: 0.5em;
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}
	select option {
		text-align: left;
	}
	select {
		background-color: unset;
		height: unset;
		padding: unset;
		padding-left: 46px;
		padding-right: 0.75em;
		width: unset;
		flex-grow: 1;
	}
	select:disabled:hover {
		color: var(--color-text);
	}
	select:disabled {
		opacity: 1;
	}
</style>
