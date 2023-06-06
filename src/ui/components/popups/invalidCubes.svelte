<script lang="ts">
	import { getInvalidCubes } from '../../../mods/cubeMod'
	import { translate } from '../../../util/translation'

	const invalidCubes = getInvalidCubes()

	function getParentName(cube: Cube) {
		return cube.parent instanceof Group ? cube.parent.name : cube.parent
	}

	const sortedCubes: Record<string, Cube[]> = {}
	for (const cube of invalidCubes) {
		const parentName = getParentName(cube)
		if (!parentName) continue
		if (!sortedCubes[parentName]) sortedCubes[parentName] = []
		sortedCubes[parentName].push(cube)
	}
</script>

<div class="container">
	{#each translate('animated_java.popup.invalid_cubes.body').split('\n') as line}
		<p>{line}</p>
	{/each}
	{#each Object.entries(sortedCubes) as [parentName, cubes]}
		<h5>{parentName}</h5>
		<div class="bone-container">
			<ul>
				{#each cubes as cube}
					<li>{cube.name}</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<style>
	div.container {
		overflow-y: auto;
		max-height: 30em;
	}
	div.bone-container {
		background-color: var(--color-back);
		padding: 0.25em 0.75em;
		margin: 10px;
		margin-top: 0px;
	}
	ul {
		margin-left: 2em;
	}
	li {
		list-style: unset;
	}
	h5 {
		background-color: var(--color-button);
		text-align: center;
		margin-bottom: 0px;
		margin-left: 10px;
		margin-right: 10px;
	}
	p {
		margin: 10px;
	}
</style>
