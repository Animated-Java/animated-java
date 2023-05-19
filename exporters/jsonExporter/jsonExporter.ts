// @ts-ignore
import en from './lang/en.yaml'
// TODO - Remake this exporter, it's a bit of a mess.
interface ISerealizedAnimationNode {
	type: 'bone' | 'camera' | 'locator'
	name: string
	uuid: string
	node: undefined
	matrix: number[]
	pos: [number, number, number]
	rot: [number, number, number, number]
	scale: [number, number, number]
	interpolation?: 'instant' | 'default'
}

function serializeFrame(frame: AnimatedJava.IRenderedFrame) {
	return {
		time: frame.time,
		nodes: frame.nodes.map(serializeAnimationNode),
		variant: frame.variant,
		commands: frame.commands,
		animationState: frame.animationState,
	}
}

function serializeOutlinerNode(node: AnimatedJava.AnyRenderedNode) {
	switch (node.type) {
		case 'bone': {
			const {
				type,
				name,
				parent,
				customModelData,
				resourceLocation,
				scale,
				modelPath,
				node: outlinerNode,
			} = node
			return {
				type,
				parent,
				name,
				uuid: outlinerNode.uuid,
				customModelData,
				resourceLocation,
				scale,
				modelPath,
			}
		}
		case 'camera': {
			const { type, name, parent, teleported_entity_type, node: outlinerNode } = node
			return {
				type,
				parent,
				name,
				uuid: outlinerNode.uuid,
				teleported_entity_type,
			}
		}
		case 'locator': {
			const { type, name, parent, teleported_entity_type, node: outlinerNode } = node
			return {
				type,
				parent,
				name,
				uuid: outlinerNode.uuid,
				teleported_entity_type,
			}
		}
	}
}

function serializeAnimationNode(node: AnimatedJava.IAnimationNode): ISerealizedAnimationNode {
	const { type, name, uuid, matrix, pos, rot, scale, interpolation } = node
	return {
		type,
		name,
		uuid,
		node: undefined,
		matrix: matrix.toArray(),
		pos: [pos.x, pos.y, pos.z],
		rot: [rot.x, rot.y, rot.z, rot.w],
		scale: [scale.x, scale.y, scale.z],
		interpolation,
	}
}

interface ISerealizedAnimation {
	frames: ISerealizedAnimationNode[]
	duration: number
	loopMode: 'loop' | 'once' | 'hold'
}

function serializeAnimation(animation: AnimatedJava.IRenderedAnimation): any {
	return {
		...animation,
		frames: animation.frames.map(serializeFrame),
	}
}

interface RawExportData {
	project_settings: Record<string, any>
	exporter_settings: Record<string, any>
	rig: {
		default_pose: ISerealizedAnimationNode[]
		node_structure: AnimatedJava.INodeStructure
		node_map: any
	}
	animations: Record<string, ISerealizedAnimation>
}

export function loadExporter() {
	const API = AnimatedJava.API

	API.addTranslations('en', en as Record<string, string>)

	const TRANSLATIONS = {
		output_file: {
			error: {
				empty: API.translate(
					'animated_java.exporters.json_exporter.settings.output_file.error.empty'
				),
			},
		},
	}

	new API.Exporter({
		id: 'animated_java:json_exporter',
		name: API.translate('animated_java.exporters.json_exporter.name'),
		description: API.translate('animated_java.exporters.json_exporter.description'),
		getSettings() {
			return {
				output_file: new API.Settings.FileSetting(
					{
						id: 'animated_java:json_exporter/output_file',
						displayName: API.translate(
							'animated_java.exporters.json_exporter.settings.output_file'
						),
						description: API.translate(
							'animated_java.exporters.json_exporter.settings.output_file.description'
						).split('\n'),
						defaultValue: '',
					},
					function onUpdate(setting) {
						if (!setting.value) {
							setting.infoPopup = API.createInfo(
								'error',
								TRANSLATIONS.output_file.error.empty
							)
						}
					}
				),
			}
		},
		settingsStructure: [
			{
				type: 'setting',
				settingId: 'animated_java:json_exporter/output_file',
			},
		],
		async export(exportOptions) {
			console.log('Export Options:', exportOptions)

			const data: RawExportData = {
				project_settings: {},
				exporter_settings: {},
				rig: {
					default_pose: exportOptions.rig.defaultPose.map(serializeAnimationNode),
					node_structure: exportOptions.rig.nodeStructure,
					node_map: {},
				},
				animations: {},
			}

			for (const [key, setting] of Object.entries(exportOptions.projectSettings)) {
				data.project_settings[key] = setting._save()
			}

			for (const [key, setting] of Object.entries(exportOptions.exporterSettings)) {
				data.exporter_settings[key] = setting._save()
			}

			for (const [uuid, node] of Object.entries(exportOptions.rig.nodeMap)) {
				if (!node.node.export) continue
				data.rig.node_map[uuid] = serializeOutlinerNode(node)
			}

			for (const animation of exportOptions.renderedAnimations) {
				data.animations[animation.name] = serializeAnimation(animation)
			}

			console.log('Exported data:', data)

			await fs.promises.writeFile(
				exportOptions.exporterSettings.output_file.value,
				exportOptions.ajSettings.minify_output.value
					? JSON.stringify(data)
					: JSON.stringify(data, null, '\t')
			)
		},
	})
}
