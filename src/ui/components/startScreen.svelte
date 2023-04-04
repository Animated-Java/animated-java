<script lang="ts">
	function documentationOnClick() {
		AnimatedJava.docClick('page:index')
	}
	function gettingStatedOnClick() {
		AnimatedJava.docClick('page:getting_started')
	}
</script>

<div>
	<h1>Welcome to Animated Java!</h1>
	<!-- svelte-ignore a11y-missing-attribute -->
	<h3>Good to know</h3>
	<div style="padding-left: 2em;">
		<ul class="markdown">
			<li>Model size is not limited by Java edition model constraints.</li>
			<li />
		</ul>
	</div>
	<h3>Resources</h3>
	<div style="padding-left: 2em;">
		<ul class="markdown">
			<li class="link" on:click={documentationOnClick} on:keydown={() => {}}>
				Documentation
			</li>
			<li class="link" on:click={gettingStatedOnClick} on:keydown={() => {}}>
				Getting Started
			</li>
		</ul>
	</div>
</div>

<style>
	.link {
		cursor: pointer;
		text-decoration: underline;
	}
	.link:hover {
		color: var(--color-light);
	}
</style>
