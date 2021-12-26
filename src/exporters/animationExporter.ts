import * as aj from '../animatedJava'

interface animationExporterSettings {
	modelTag: string
	rootTag: string
	allBonesTag: string
	individualBoneTag: string
	rootEntityType: string
	boneType: 'aecStack' | 'armorStand'
	internalScoreboardObjective: string
	idScoreboardObjective: string
	exportMode: 'datapack' | 'mcb'
	mcbFilePath: string | undefined
	dataPackFilePath: string | undefined
	markerArmorStands: boolean
}

async function createMCFile(
	bones: aj.BoneObject,
	models: aj.ModelObject,
	animations: aj.Animations,
	settings: aj.Settings,
	variantModels: aj.VariantModels,
	variantTextureOverrides: aj.VariantTextureOverrides,
	variantTouchedModels: aj.variantTouchedModels
): Promise<string> {
	const ajSettings = settings.animatedJava
	const exporterSettings: animationExporterSettings = settings.animatedJava_exporter_animationExporter

	const FILE: string[] = []

	return FILE.join('\n')
}


function animationExport(data: any) {

	const mcFile = createMCFile(
		data.bones,
		data.models,
		data.animations,
		data.settings,
		data.variantModels,
		data.variantTextureOverrides,
		data.variantTouchedModels
	)

}

const Exporter = (AJ: any) => {
	AJ.settings.registerPluginSettings('animatedJava_exporter_animationExporter', {
		rootEntityType: {
			type: 'text',
			default: 'minecraft:marker',
			populate() {
				return 'minecraft:marker'
			},
			isValid(value: any) {
				return value != ''
			},
			isResetable: true,
		},
		boneType: {
			type: 'select',
			default: 'aecStack',
			options: {
				aecStack:
					'animatedJava_exporter_animationExporter.setting.boneType.aecStack.name',
				armorStand:
					'animatedJava_exporter_animationExporter.setting.boneType.armorStand.name',
			},
			populate() {
				return 'area_effect_cloud'
			},
			isValid(value: any) {
				return value != ''
			},
			isResetable: true,
		},
		markerArmorStands: {
			type: 'checkbox',
			default: true,
			populate() {
				return true
			},
			isValid(value: any) {
				return typeof value === 'boolean'
			},
		},
		modelTag: {
			type: 'text',
			default: 'aj.%modelName',
			populate() {
				return 'aj.%modelName'
			},
			isValid(value: any) {
				return value != ''
			},
			isResetable: true,
		},
		rootTag: {
			type: 'text',
			default: 'aj.%modelName.root',
			populate() {
				return 'aj.%modelName.root'
			},
			isValid(value: any) {
				return value != ''
			},
			isResetable: true,
		},
		allBonesTag: {
			type: 'text',
			default: 'aj.%modelName.bone',
			populate() {
				return 'aj.%modelName.bone'
			},
			isValid(value: any) {
				return value != ''
			},
			isResetable: true,
		},
		individualBoneTag: {
			type: 'text',
			default: 'aj.%modelName.%boneName',
			populate() {
				return 'aj.%modelName.%boneName'
			},
			isValid(value: any) {
				return value != ''
			},
			isResetable: true,
		},
		internalScoreboardObjective: {
			type: 'text',
			default: 'aj.i',
			populate() {
				return 'aj.i'
			},
			isValid(value: any) {
				return value != ''
			},
		},
		idScoreboardObjective: {
			type: 'text',
			default: 'aj.id',
			populate() {
				return 'aj.id'
			},
			isValid(value: any) {
				return value != ''
			},
		},
		exportMode: {
			type: 'select',
			default: 'mcb',
			options: {
				vanilla:
					'animatedJava_exporter_animationExporter.setting.exportMode.vanilla.name',
				mcb: 'animatedJava_exporter_animationExporter.setting.exportMode.mcb.name',
			},
			populate() {
				return 'mcb'
			},
			isValid(value: any) {
				return value != ''
			},
		},
		mcbFilePath: {
			type: 'filepath',
			default: '',
			props: {
				dialogOpts: {
					// @ts-ignore
					defaultPath: Project.name + '.mc',
					promptToCreate: true,
					properties: ['openFile'],
				},
			},
			populate() {
				return ''
			},
			isValid(value: any) {
				return true
			},
			isVisible(settings: any) {
				return (
					settings.animatedJava_exporter_animationExporter.exportMode ===
					'mcb'
				)
			},
			dependencies: ['animatedJava_exporter_animationExporter.exportMode'],
		},
		dataPackPath: {
			type: 'filepath',
			default: '',
			props: {
				target: 'folder',
				dialogOpts: {
					promptToCreate: true,
					properties: ['openDirectory'],
				},
			},
			populate() {
				return ''
			},
			isValid(value: any) {
				return true
			},
			isVisible(settings: any) {
				return (
					settings.animatedJava_exporter_animationExporter.exportMode ===
					'vanilla'
				)
			},
			dependencies: ['animatedJava_exporter_animationExporter.exportMode'],
		},
	})
	AJ.registerExportFunc('animationExporter', function () {
		AJ.build(
			(data: any) => {
				console.log('Input Data:', data)
				animationExport(data)
			},
			{
				generate_static_animation: false,
			}
		)
	})
}
if (Reflect.has(window, 'ANIMATED_JAVA')) {
	Exporter(window['ANIMATED_JAVA'])
} else {
	// there is absolutly shit we can do about this
	// @ts-ignore
	Blockbench.on('animated-java-ready', Exporter)
}
