<script lang="ts">
	function gettingStatedOnClick() {
		AnimatedJava.docClick('page:getting_started')
	}
</script>

<div>
	<!-- svelte-ignore a11y-missing-attribute -->
	<h3 class="link" on:click={gettingStatedOnClick} on:keydown={() => {}}>Getting Started</h3>
</div>

<style>
	h3.link {
		cursor: pointer;
		text-decoration: underline;
	}
	h3.link:hover {
		color: var(--color-light);
	}
</style>
