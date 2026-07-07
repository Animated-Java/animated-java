<script lang="ts">
	import { getEntityCounts } from '../../mods/entityCounter'
	import { createScopedTranslator } from '../../util/lang'

	const localize = createScopedTranslator('dialog.entity_count_dialog')

	const {
		groupEntities,
		displayEntities,
		locatorEntities,
		cameraEntities,
		interactionEntities,
		totalEntities,
	} = getEntityCounts()
</script>

<div class="entity-count-dialog">
	<div class="entity-count-description">{@html localize('description')}</div>
	<hr />
	<div class="entity-count-row">
		<div class="entity-count-label">{localize('root_entities')}</div>
		<div class="spacer"></div>
		<div class="entity-count-value">{1}</div>
	</div>
	<div class="entity-count-row">
		<div class="entity-count-label">{localize('group_entities')}</div>
		<div class="spacer"></div>
		<div class="entity-count-value">{groupEntities}</div>
	</div>
	<div class="entity-count-row">
		<div class="entity-count-label">{localize('display_entities')}</div>
		<div class="spacer"></div>
		<div class="entity-count-value">{displayEntities}</div>
	</div>
	<div class="entity-count-row">
		<div class="entity-count-label">{localize('locator_entities')}</div>
		<div class="spacer"></div>
		<div class="entity-count-value">{locatorEntities}</div>
	</div>
	<div class="entity-count-row">
		<div class="entity-count-label">{localize('camera_entities')}</div>
		<div class="spacer"></div>
		<div class="entity-count-value">{cameraEntities}</div>
	</div>
	<div class="entity-count-row">
		<div class="entity-count-label">{localize('interaction_entities')}</div>
		<div class="spacer"></div>
		<div class="entity-count-value">{interactionEntities}</div>
	</div>
	<hr />
	<div class="entity-count-row total">
		<div class="entity-count-label">{localize('total_entities')}</div>
		<div class="spacer"></div>
		<div class="entity-count-value">{totalEntities}</div>
	</div>
</div>

<style>
	.entity-count-dialog {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.entity-count-description {
		font-size: 0.9em;
		color: var(--color-text-secondary);
	}

	.entity-count-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.entity-count-value {
		font-family: monospace;
	}

	hr {
		border-top: 2px solid var(--color-button);
	}

	.total .entity-count-label {
		font-size: 1.1em;
	}

	.total .entity-count-value {
		font-size: 1.1em;
	}

	.spacer {
		flex-grow: 1;
		border-bottom: 2px dashed var(--color-button);
		margin: 0 16px;
	}
</style>
