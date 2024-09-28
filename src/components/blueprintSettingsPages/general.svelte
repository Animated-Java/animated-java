<script lang="ts">
	import { defaultValues } from '../../blueprintSettings'
	import type { ValuableBlueprintSettings } from '../../interface/blueprintSettingsDialog'
	import BoxSelect from '../sidebarDialogItems/boxSelect.svelte'
	import LineEdit from '../sidebarDialogItems/lineEdit.svelte'
	import ImpulseCommandBlock from '../../assets/impulse_command_block.png'
	import PaperIcon from '../../assets/papermc.svg'
	import {
		containsInvalidResourceLocationCharacters,
		parseResourceLocation,
	} from '../../util/minecraftUtil'

	export let settings: ValuableBlueprintSettings

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
		} else if (parsed.namespace === 'animated_java' && parsed.path === 'global') {
			return {
				type: 'error',
				message: 'The ID `animated_java:global` is reserved for internal functionality',
			}
		} else if (parsed.path === '') {
			return {
				type: 'error',
				message: "The ID's `path` cannot be empty",
			}
		}

		return { type: 'success' }
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

<style>
</style>
