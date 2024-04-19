<script lang="ts" context="module">
</script>

<script lang="ts">
	export let error: Error
</script>

<div>
	<textarea class="dark_bordered" value={error.message + '\n' + (error.stack || '')} readonly />
</div>

<style>
	div {
		height: 25rem;
	}
	textarea {
		width: 100%;
		height: 100%;
	}
</style>
