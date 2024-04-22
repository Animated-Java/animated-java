import { SvelteComponentDev } from 'svelte/internal'
import ImportAjModelLoaderDialog from '../components/importAJModelLoaderDialog.svelte'
import { PACKAGE } from '../constants'
import { injectSvelteCompomponent } from '../util/injectSvelte'
import { createModelLoader } from '../util/moddingTools'
import { translate } from '../util/translation'
import { BLUEPRINT_CODEC, IBlueprintFormatJSON } from '../blueprintFormat'
import { openUnexpectedErrorDialog } from './unexpectedErrorDialog'
import { BoneConfig } from '../boneConfig'

let activeComponent: SvelteComponentDev | null = null

createModelLoader(`${PACKAGE.name}-upgradeAJModelLoader`, {
	icon: 'folder_open',
	category: 'animated_java',
	name: translate('action.upgrade_old_aj_model_loader.name'),
	condition() {
		return true
	},
	format_page: {
		component: {
			template: `<div id="${PACKAGE.name}-upgradeAJModelLoader-target" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;"></div>`,
		},
	},
	onFormatPage() {
		console.log('Upgrade Old .ajmodel Loader')
		if (activeComponent) {
			activeComponent.$destroy()
		}
		injectSvelteCompomponent({
			svelteComponent: ImportAjModelLoaderDialog,
			svelteComponentProperties: {},
			elementSelector() {
				return document.querySelector(`#${PACKAGE.name}-upgradeAJModelLoader-target`)
			},
			postMount(el) {
				activeComponent = el
			},
			injectIndex: 2,
		})
	},
})

export function convertAJModelToBlueprint(path: string) {
	try {
		console.log(`Convert Old .ajmodel: ${path}`)
		const ajmodel = JSON.parse(fs.readFileSync(path, 'utf8'))

		const datapackExporterSettings =
			ajmodel.animated_java.exporter_settings['animated_java:datapack_exporter']

		const defaultVariant = ajmodel.animated_java.variants.find((v: any) => !!v.default)
		console.log(defaultVariant)
		const variants = ajmodel.animated_java.variants.filter((v: any) => !v.default)

		const blueprint: IBlueprintFormatJSON = {
			meta: {
				format: 'animated_java_blueprint',
				format_version: PACKAGE.version,
				uuid: ajmodel.meta.uuid || guid(),
				last_used_export_namespace: ajmodel.animated_java.settings.project_namespace,
			},
			project_settings: {
				export_namespace: ajmodel.animated_java.settings.project_namespace,
				enable_plugin_mode: false,
				enable_resource_pack: true,
				display_item: ajmodel.animated_java.settings.rig_item,
				customModelDataOffset: 0,
				enable_advanced_resource_pack_settings:
					ajmodel.animated_java.settings.enable_advanced_resource_pack_settings,
				resource_pack: ajmodel.animated_java.settings.resource_pack_mcmeta.replace(
					/\.mcmeta$/,
					''
				),
				display_item_path: ajmodel.animated_java.settings.rig_item_model,
				model_folder: ajmodel.animated_java.settings.rig_export_folder,
				texture_folder: ajmodel.animated_java.settings.texture_export_folder,
				enable_data_pack: true,
				enable_advanced_data_pack_settings: false,
				data_pack: datapackExporterSettings.datapack_mcmeta.replace(/\.mcmeta$/, ''),
				custom_summon_commands: '',
			},
			variants: {
				default: {
					name: 'default',
					display_name: defaultVariant.name || 'Default',
					uuid: defaultVariant.uuid || guid(),
					texture_map: defaultVariant.textureMap || {},
					excluded_bones: [],
				},
				list: [],
			},
			resolution: ajmodel.resolution,
			outliner: [],
			elements: ajmodel.elements,
			animations: ajmodel.animations,
			textures: ajmodel.textures,
			animation_variable_placeholders: ajmodel.animation_variable_placeholders,
		}

		const bones: string[] = []

		const recurseOutliner = (node: any) => {
			bones.push(node.uuid as string)
			node.configs = {
				default: new BoneConfig().toJSON(),
				variants: {},
			}
			node.children.forEach((child: any) => {
				if (typeof child === 'string') return
				recurseOutliner(child)
			})
			if (node.nbt && node.nbt !== '{}') {
				node.configs.default.use_nbt = true
				node.configs.default.nbt = node.nbt
				delete node.nbt
			}
		}

		ajmodel.outliner.forEach(recurseOutliner)
		blueprint.outliner = ajmodel.outliner

		for (const variant of variants) {
			const affectedBones = variant.affectedBones.map((v: any) => v.value as string)
			let excludedBones: string[]
			if (variant.affectedBonesIsAWhitelist) {
				excludedBones = bones.filter(b => !affectedBones.includes(b))
			} else {
				excludedBones = affectedBones
			}

			blueprint.variants.list.push({
				name: variant.name,
				display_name: variant.name,
				uuid: variant.uuid,
				texture_map: variant.textureMap,
				excluded_bones: excludedBones,
			})
		}

		// Convert rig nbt into data merge command
		if (
			datapackExporterSettings.root_entity_nbt &&
			datapackExporterSettings.root_entity_nbt !== '{}'
		) {
			blueprint.project_settings!.custom_summon_commands = `data merge entity @s ${
				datapackExporterSettings.root_entity_nbt as string
			}`
		}

		console.log('Finished Blueprint:', blueprint)
		BLUEPRINT_CODEC.load(blueprint, {
			name: 'Upgrade .ajmodel to Blueprint',
			path: undefined,
		})
	} catch (e) {
		console.error(e)
		openUnexpectedErrorDialog(e as Error)
	}
}
