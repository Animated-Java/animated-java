<script lang="ts">
	export let label: string
	export let value: string
</script>

<div class="dialog_bar form_bar">
	<label class="name_space_left" for="name">{label}</label>
	<input type="text" class="dark_bordered half focusable_input" id="name" bind:value />
</div>
