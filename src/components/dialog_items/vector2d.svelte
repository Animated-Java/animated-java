<script lang="ts">
	export let label: string

	export let valueX: number
	export let minX: number | undefined = undefined
	export let maxX: number | undefined = undefined

	$: if (minX !== undefined && valueX < minX) valueX = minX
	$: if (maxX !== undefined && valueX > maxX) valueX = maxX

	export let valueY: number
	export let minY: number | undefined = undefined
	export let maxY: number | undefined = undefined

	$: if (minY !== undefined && valueY < minY) valueY = minY
	$: if (maxY !== undefined && valueY > maxY) valueY = maxY
</script>

<div class="dialog_bar form_bar">
	<label class="name_space_left" for="name">{label}</label>
	<div class="dialog_vector_group half">
		<div class="numeric_input">
			<input
				id="snapping"
				class="dark_bordered focusable_input"
				bind:value={valueX}
				inputmode="decimal"
			/>
			<div class="tool numaric_input_slider">
				<i class="material-icons icon">code</i>
			</div>
		</div>
		<div class="numeric_input">
			<input
				id="snapping"
				class="dark_bordered focusable_input"
				bind:value={valueY}
				inputmode="decimal"
			/>
			<div class="tool numaric_input_slider">
				<i class="material-icons icon">code</i>
			</div>
		</div>
	</div>
</div>
