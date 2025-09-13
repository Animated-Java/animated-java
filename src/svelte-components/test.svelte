<script lang="ts">
	interface Props {
		value?: number
	}

	const { value = 0 }: Props = $props()

	let count = $state(value)

	function add() {
		count++
	}
</script>

<button onclick={add}>{count}</button>

<style>
	button {
		color: blue;
	}
</style>
