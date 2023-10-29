<script lang="ts">
	export let label: string
	export let checked: boolean
</script>

<div class="dialog_bar form_bar">
	<label class="name_space_left" for="export">{label}</label>
	<input type="checkbox" class="focusable_input" id="export" bind:checked />
</div>
