<script lang="ts">
	export let label: string
	export let tooltip: string
</script>

<div>
	<slot {label} {tooltip} />
</div>

<style></style>
