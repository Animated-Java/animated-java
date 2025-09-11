<script lang="ts">
	let test = $state(0)

	function add() {
		test++
	}
</script>

<button onclick={add}>{test}</button>

<style>
	button {
		color: blue;
	}
</style>
