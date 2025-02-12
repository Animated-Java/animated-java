<script lang="ts">
	import type { ValuableBlueprintSettings } from '..'
	import { defaultValues } from '../../../../blueprintSettings'
	import Checkbox from '../../../../svelte-components/sidebar-dialog-items/checkbox.svelte'
	import LineEdit from '../../../../svelte-components/sidebar-dialog-items/lineEdit.svelte'
	import OptionSelect from '../../../../svelte-components/sidebar-dialog-items/optionSelect.svelte'
	import { type MinecraftVersion } from '../../../../systems/datapackCompiler/mcbFiles'
	import {
		containsInvalidScoreboardTagCharacters,
		createTagPrefixFromBlueprintID,
	} from '../../../../util/minecraftUtil'
	import { translate } from '../../../../util/translation'

	export let settings: ValuableBlueprintSettings

	const BLUEPRINT_ID = settings.id
	const TAG_PREFIX = settings.tag_prefix
	const AUTO_TAG_PREFIX = settings.auto_generate_tag_prefix

	// Defining this here to get TS errors when the values are not updated.
	const VERSION_OPTIONS: Record<MinecraftVersion, MinecraftVersion> = {
		'1.21.4': '1.21.4',
		'1.21.2': '1.21.2',
		'1.21.0': '1.21.0',
		'1.20.5': '1.20.5',
		'1.20.4': '1.20.4',
	}

	$: if ($AUTO_TAG_PREFIX) {
		const tag = createTagPrefixFromBlueprintID($BLUEPRINT_ID)
		if (tag) {
			$TAG_PREFIX = tag
		}
	}

	const tagPrefexChecker: DialogItemValueChecker<string> = value => {
		if (value === '') {
			return {
				type: 'error',
				message: 'The Tag Prefix cannot be empty!',
			}
		} else if (containsInvalidScoreboardTagCharacters(value)) {
			return {
				type: 'error',
				message: 'The Tag Prefix contains invalid characters!',
			}
		}

		return { type: 'success' }
	}
</script>

<OptionSelect
	label={translate('dialog.blueprint_settings.export.target_minecraft_version.label')}
	description={translate('dialog.blueprint_settings.export.target_minecraft_version.description')}
	selected={settings.target_minecraft_version}
	options={VERSION_OPTIONS}
	required
/>

<LineEdit
	label={translate('dialog.blueprint_settings.export.tag_prefix.label')}
	description={translate('dialog.blueprint_settings.export.tag_prefix.description')}
	value={settings.tag_prefix}
	defaultValue={defaultValues.tag_prefix}
	required
	disabled={$AUTO_TAG_PREFIX}
	valueChecker={tagPrefexChecker}
/>

<Checkbox
	label={translate('dialog.blueprint_settings.export.auto_generate_tag_prefix.label')}
	description={translate('dialog.blueprint_settings.export.auto_generate_tag_prefix.description')}
	checked={settings.auto_generate_tag_prefix}
/>
