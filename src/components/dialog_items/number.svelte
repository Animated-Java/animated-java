<script lang="ts">
	export let label: string
	export let value: number
	export let min: number | undefined = undefined
	export let max: number | undefined = undefined

	$: if (min !== undefined && value < min) value = min
	$: if (max !== undefined && value > max) value = max
</script>

<div class="dialog_bar form_bar">
	<label class="name_space_left" for="name">{label}</label>
	<div class="numeric_input">
		<input id="snapping" class="dark_bordered focusable_input" bind:value inputmode="decimal" />
		<div class="tool numaric_input_slider">
			<i class="material-icons icon">code</i>
		</div>
	</div>
</div>
