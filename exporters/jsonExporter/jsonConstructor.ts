type NodeType = 'bone' | 'camera' | 'locator'

interface ISerializedVariantModel {
	custom_model_data: number
	resource_location: string
}

interface ISerializedVariant {
	name: string
	uuid: string
	models: Record<string, ISerializedVariantModel>
	affected_bones: string[]
	affected_bones_is_a_whitelist: boolean
}

interface ISerializedAnimationFrame {
	nodes: ISerializedNodeAnimationFrameEntry[]
	time: number
	variant?: {
		uuid: string
		execute_condition?: string
	}
	commands?: {
		commands: string
		execute_condition?: string
	}
}

interface ISerializedNodeAnimationFrameEntry {
	uuid: string
	matrix: number[]
}

interface ISerealizedAnimation {
	start_delay?: number
	loop_delay?: number
	duration: number
	loop_mode: 'once' | 'hold' | 'loop'
	affected_bones: string[]
	affected_bones_is_a_whitelist: boolean
	frames: ISerializedAnimationFrame[]
}

interface ISerializedNode {
	type: NodeType
	name: string
	uuid: string
	nbt: string
	entity_type?: string
	custom_model_data?: number
	resource_location?: string
	bounding_box?: THREE.Box3
}

interface ISerializedVariant {
	name: string
	uuid: string
	models: Record<string, ISerializedVariantModel>
	affected_bones: string[]
	affected_bones_is_a_whitelist: boolean
}

export interface IJSONExport {
	project_settings: Record<string, any>
	exporter_settings: Record<string, any>
	rig: {
		default_pose: ISerializedNodeAnimationFrameEntry[]
		node_map: Record<string, ISerializedNode>
	}
	variants: Record<string, ISerializedVariant>
	animations: Record<string, ISerealizedAnimation>
}

function serializeProjectSettings(): Record<string, any> {
	const project_settings = {}
	for (const [name, setting] of Object.entries(Project!.animated_java_settings)) {
		project_settings[name] = setting._save()
	}
	return project_settings
}

function serializeExporterSettings(exporterSettings: Record<string, any>): Record<string, any> {
	const exporter_settings = {}
	for (const [name, setting] of Object.entries(exporterSettings)) {
		exporter_settings[name] = setting._save()
	}
	return exporter_settings
}

function serializeNodeAnimationFrameEntry(
	node: AnimatedJava.IAnimationNode
): ISerializedNodeAnimationFrameEntry {
	const { type, uuid, matrix } = node
	return {
		uuid,
		matrix: matrix.toArray(),
	}
}

function serializeNodeMap(
	nodeMap: Record<string, AnimatedJava.IRenderedNodes[keyof AnimatedJava.IRenderedNodes]>
): Record<string, ISerializedNode> {
	const serializedNodeMap: Record<string, ISerializedNode> = {}
	for (const uuid in nodeMap) {
		const node = nodeMap[uuid]
		const type = node.type
		const name = node.name

		switch (type) {
			case 'bone': {
				const custom_model_data = node.customModelData
				const resource_location = node.resourceLocation
				const bounding_box = node.boundingBox

				serializedNodeMap[uuid] = {
					type,
					name,
					uuid,
					nbt: node.nbt,
					custom_model_data,
					resource_location,
					bounding_box: bounding_box,
				}

				break
			}
			case 'camera':
			case 'locator': {
				serializedNodeMap[uuid] = {
					type,
					name,
					uuid,
					nbt: node.nbt,
					entity_type: node.entity_type,
				}
			}
		}
	}
	return serializedNodeMap
}

function serializeVariant(
	exportOptions: AnimatedJava.IAnimatedJavaExportData<unknown>,
	variant: AnimatedJava.Variant
): ISerializedVariant {
	const name = variant.name
	const uuid = variant.uuid
	const models = {}
	const affected_bones = variant.affectedBones.map(v => v.value)
	const affected_bones_is_a_whitelist = variant.affectedBonesIsAWhitelist

	for (const [uuid, model] of Object.entries(exportOptions.rig.variantModels[name])) {
		models[uuid] = {
			custom_model_data: model.customModelData,
			resource_location: model.resourceLocation,
		}
	}

	return {
		name,
		uuid,
		models,
		affected_bones,
		affected_bones_is_a_whitelist,
	}
}

function serializeAnimationFrame(
	frame: AnimatedJava.IRenderedAnimation['frames'][any]
): ISerializedAnimationFrame {
	const nodes = frame.nodes.map(serializeNodeAnimationFrameEntry)
	const time = frame.time
	const variant = frame.variant
	const commands = frame.commands

	return {
		nodes,
		time,
		variant,
		commands,
	}
}

function serializeAnimation(animation: AnimatedJava.IRenderedAnimation): ISerealizedAnimation {
	const start_delay = animation.startDelay
	const loop_delay = animation.loopDelay
	const frames = animation.frames.map(serializeAnimationFrame)
	const duration = animation.duration
	const loop_mode = animation.loopMode
	const bbAnimation = Blockbench.Animation.all.find(
		v => v instanceof Blockbench.Animation && v.name === animation.name
	) as _Animation
	const affected_bones = bbAnimation.affected_bones.map(v => v.value)
	const affected_bones_is_a_whitelist = bbAnimation.affected_bones_is_a_whitelist

	return {
		start_delay,
		loop_delay,
		frames,
		duration,
		loop_mode,
		affected_bones,
		affected_bones_is_a_whitelist,
	}
}

export function constructJSON(
	exportOptions: AnimatedJava.IAnimatedJavaExportData<unknown>
): IJSONExport {
	const {} = AnimatedJava.API
	const project_settings = serializeProjectSettings()
	const exporter_settings = serializeExporterSettings(exportOptions.exporterSettings)
	const rig = {
		default_pose: exportOptions.rig.defaultPose.map(serializeNodeAnimationFrameEntry),
		node_map: serializeNodeMap(exportOptions.rig.nodeMap),
	}
	const variants = {}
	const animations = {}

	for (const variant of Project!.animated_java_variants.variants) {
		if (variant.default) continue
		variants[variant.uuid] = serializeVariant(exportOptions, variant)
	}

	for (const animation of exportOptions.renderedAnimations) {
		animations[animation.name] = serializeAnimation(animation)
	}

	return {
		project_settings,
		exporter_settings,
		rig,
		variants,
		animations,
	}
}
