<script lang="ts">
	export let content: string
</script>

<h2 class="decorated"><span>{content}</span></h2>

<style>
	.decorated {
		overflow: hidden;
		text-align: center;
		font-weight: normal !important;
		margin-bottom: 10px;
		flex-grow: 1;
	}
	.decorated > span {
		position: relative;
		display: inline-block;
	}
	.decorated > span:before,
	.decorated > span:after {
		content: '';
		position: absolute;
		top: 50%;
		border-bottom: 2px solid;
		width: 591px; /* half of limiter*/
		margin: 0 20px;
	}
	.decorated > span:before {
		right: 100%;
	}
	.decorated > span:after {
		left: 100%;
	}
</style>
