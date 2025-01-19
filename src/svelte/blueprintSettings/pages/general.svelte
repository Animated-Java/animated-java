<script lang="ts">
	import { defaultValues } from '../../../blueprintSettings'
	import type { ValuableBlueprintSettings } from '../'
	import BoxSelect from '../../components/sidebarDialogItems/boxSelect.svelte'
	import LineEdit from '../../components/sidebarDialogItems/lineEdit.svelte'
	import ImpulseCommandBlock from '../../../assets/impulse_command_block.png'
	import PaperIcon from '../../../assets/papermc.svg'
	import Vector2d from '../../components/sidebarDialogItems/vector2d.svelte'
	import OptionSelect from '../../components/sidebarDialogItems/optionSelect.svelte'
	import Checkbox from '../../components/sidebarDialogItems/checkbox.svelte'
	import {
		containsInvalidResourceLocationCharacters,
		containsInvalidScoreboardTagCharacters,
		createTagPrefixFromBlueprintID,
		parseResourceLocation,
	} from '../../../util/minecraftUtil'
	import { translate } from '../../../util/translation'
	import { type MinecraftVersion } from '../../../systems/datapackCompiler/mcbFiles'

	export let settings: ValuableBlueprintSettings

	const blueprintID = settings.id
	const tagPrefix = settings.tag_prefix
	const autoGenerateTagPrefix = settings.auto_generate_tag_prefix

	// Defining this here to get TS errors when the values are not updated.
	const versions: Record<MinecraftVersion, MinecraftVersion> = {
		'1.20.4': '1.20.4',
		'1.20.5': '1.20.5',
		'1.21.0': '1.21.0',
		'1.21.2': '1.21.2',
		'1.21.4': '1.21.4',
	}

	$: if ($autoGenerateTagPrefix) {
		const tag = createTagPrefixFromBlueprintID($blueprintID)
		if (tag) {
			$tagPrefix = tag
		}
	}

	const blueprintIDChecker: DialogItemValueChecker<string> = (value: string) => {
		if (value === '') {
			return {
				type: 'error',
				message: 'The Blueprint ID cannot be empty!',
			}
		} else if (containsInvalidResourceLocationCharacters(value)) {
			return {
				type: 'error',
				message: 'The ID contains invalid characters!',
			}
		}
		const parsed = parseResourceLocation(value)
		if (!parsed) {
			return {
				type: 'error',
				message: 'The ID must be in the format `namespace:path`',
			}
		} else if (parsed.namespace === 'minecraft') {
			return {
				type: 'error',
				message: 'The namespace `minecraft` is reserved for vanilla content',
			}
		} else if (parsed.namespace === 'animated_java' && parsed.subpath === 'global') {
			return {
				type: 'error',
				message: 'The ID `animated_java:global` is reserved for internal functionality',
			}
		} else if (parsed.subpath === '') {
			return {
				type: 'error',
				message: "The ID's `path` cannot be empty",
			}
		}

		return { type: 'success' }
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

	const textureSizeChecker: DialogItemValueChecker<{ x: number; y: number }> = value => {
		const x = Number(value.x)
		const y = Number(value.y)
		const largestHeight: number = Number(
			Texture.all
				.map(t => (t.frameCount ? t.width : t.height))
				.reduce((max, cur) => Math.max(max, cur), 0),
		)
		const largestWidth: number = Number(
			Texture.all
				.map(t => (t.frameCount ? t.width : t.height))
				.reduce((max, cur) => Math.max(max, cur), 0),
		)

		if (!(x === largestWidth && y === largestHeight)) {
			return {
				type: 'warning',
				message: translate(
					'dialog.blueprint_settings.texture_size.warning.does_not_match_largest_texture',
				),
			}
		} else if (x !== 2 ** Math.floor(Math.log2(x)) || y !== 2 ** Math.floor(Math.log2(y))) {
			return {
				type: 'warning',
				message: translate(
					'dialog.blueprint_settings.texture_size.warning.not_a_power_of_2',
				),
			}
		} else if (x !== y) {
			return {
				type: 'warning',
				message: translate('dialog.blueprint_settings.texture_size.warning.not_square'),
			}
		} else {
			return {
				type: 'success',
				message: '',
			}
		}
	}
</script>

<BoxSelect
	label="Environment"
	description="Choose the environment you will be using to run your project."
	selected={settings.environment}
	options={{
		vanilla: {
			type: 'image',
			label: 'Data Pack &\nResource Pack',
			src: ImpulseCommandBlock,
		},
		plugin: {
			type: 'image',
			label: 'Paper Plugin',
			src: PaperIcon,
		},
	}}
/>

<LineEdit
	label="Project Name"
	description="Choose the name of your project file."
	value={settings.project_name}
	placeholder="My Project"
	required
/>

<LineEdit
	label="Blueprint ID"
	description="Choose a unique identifier for your blueprint."
	value={settings.id}
	defaultValue={defaultValues.id}
	placeholder="animated_java:unnamed_project"
	required
	valueChecker={blueprintIDChecker}
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

<Vector2d
	label="Texture Size"
	description="The size of the largest texture used for the blueprint."
	valueX={settings.texture_width}
	defaultValueX={16}
	valueY={settings.texture_height}
	defaultValueY={16}
	minX={1}
	minY={1}
	maxX={4096}
	maxY={4096}
	required
	valueChecker={textureSizeChecker}
/>

<OptionSelect
	label="Target Minecraft Version"
	description="Choose the version of Minecraft you are exporting this project for.<br/>If your exact version is not listed, choose the closest version before the one you are using."
	selected={settings.target_minecraft_version}
	options={versions}
	required
/>
