<script lang="ts">
	import { localize } from '../../util/lang'
</script>

<div><span>*</span> = {localize('dialog.blueprint_settings.required_footer')}</div>

<style>
	div {
		flex-grow: 1;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	span {
		color: var(--color-accent);
	}
</style>
