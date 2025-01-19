<script lang="ts">
	import { type ValuableBlueprintSettings } from '../'
	import { defaultValues } from '../../../blueprintSettings'
	import { type MinecraftVersion } from '../../../systems/datapackCompiler/mcbFiles'
	import {
		containsInvalidScoreboardTagCharacters,
		createTagPrefixFromBlueprintID,
	} from '../../../util/minecraftUtil'
	import Checkbox from '../../components/sidebarDialogItems/checkbox.svelte'
	import LineEdit from '../../components/sidebarDialogItems/lineEdit.svelte'
	import OptionSelect from '../../components/sidebarDialogItems/optionSelect.svelte'

	export let settings: ValuableBlueprintSettings

	const blueprintID = settings.id
	const tagPrefix = settings.tag_prefix
	const autoGenerateTagPrefix = settings.auto_generate_tag_prefix

	// Defining this here to get TS errors when the values are not updated.
	const versions: Record<MinecraftVersion, MinecraftVersion> = {
		'1.21.4': '1.21.4',
		'1.21.2': '1.21.2',
		'1.21.0': '1.21.0',
		'1.20.5': '1.20.5',
		'1.20.4': '1.20.4',
	}

	$: if ($autoGenerateTagPrefix) {
		const tag = createTagPrefixFromBlueprintID($blueprintID)
		if (tag) {
			$tagPrefix = tag
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
	label="Target Minecraft Version"
	description="Choose the version of Minecraft you are exporting this project for.<br/>If your exact version is not listed, choose the closest version before the one you are using."
	selected={settings.target_minecraft_version}
	options={versions}
	required
/>

<LineEdit
	label="Tag Prefix"
	description="Choose a prefix for the tags used in your project."
	value={settings.tag_prefix}
	defaultValue={defaultValues.tag_prefix}
	required
	disabled={$autoGenerateTagPrefix}
	valueChecker={tagPrefexChecker}
/>

<Checkbox
	label="Auto-Generate Tag Prefix"
	description="Automatically generate a tag prefix based on the blueprint ID."
	checked={settings.auto_generate_tag_prefix}
/>
