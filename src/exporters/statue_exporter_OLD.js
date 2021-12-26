import path from 'path'
import { format, fix_indent, safe_function_name } from '../util/replace'
import { store } from '../util/store'
import { Entity, JsonText } from '../util/Minecraft'
import nbtlint from '../dependencies/nbtlint/docs/nbt-lint'
import * as minecraft from '../util/minecraft'

async function exportDatapack(
	bones,
	animations,
	ajSettings,
	statueExporterSettings
) {
	const staticAnimationUuid = store.get('static_animation_uuid')
	console.log(staticAnimationUuid, animations)
	const animationBones = animations[staticAnimationUuid][0].bones
	const projectName = safe_function_name(ajSettings.project_name)

	const tags = {
		root_entity: `aj.${projectName}.root`,
		bone_entity: `aj.${projectName}.%bone_name`,
		model_identifier: `aj.${projectName}`,
		new_flag: `aj.new`,
	}

	const objectives = {
		internal: 'aj.i',
		id: statueExporterSettings.id_scoreboard_objective || 'aj.id',
		frame: 'aj.frame',
	}

	const entityTypes = {
		bones: '#example:bones',
	}

	let rootEntity = NBT.Compound()
		.String(
			'Name',
			new JsonText([
				{ text: 'aj.', color: 'gray' },
				{ text: projectName, color: 'yellow' },
				{ text: '.root', color: 'gray' },
			])
		)
		.List('Tags', null, [
			tags.root_entity,
			tags.model_identifier,
			tags.new_flag,
		])

	// const bone_entity = new Entity({
	// 	entity_type: 'minecraft:area_effect_cloud',
	// 	nbt: new nbtlint.TagCompound({
	// 		Name: new nbtlint.TagString(new JsonText([
	// 			{ text:'aj.', 'color':'gray' },
	// 			{ text:project_name, 'color':'yellow' },
	// 			{ text:'.root', 'color':'gray'}
	// 		]).toStr()),
	// 		Tags: new nbtlint.TagList([
	// 			format(datapack.getTag('bone_entity'), {bone_name: 'some_bone'}),
	// 			datapack.getTag('model_identifier'),
	// 			datapack.getTag('new_flag')
	// 		])
	// 	})
	// });

	function rootEntityCheck(function_name) {
		const errorMsg = new JsonText([
			'',
			{ text: '[', color: 'dark_gray' },
			{ text: 'Animated Java', color: 'green' },
			{ text: ' -> ', color: 'light_purple' },
			{ text: 'ERR', color: 'red' },
			{ text: ']', color: 'dark_gray' },
			'\n',
			{ text: function_name, color: 'blue' },
			' ',
			{ text: 'must be executed as ', color: 'gray' },
			{ text: `aj.${projectName}.root`, color: 'light_purple' },
		])

		return `
			execute (if entity @s[tag=${tags.root_entity}]) {
				%if_root
			} else {
				tellraw @a ${errorMsg}
			}`
	}

	const MC_FILE = []

	{
		//> Install Function
		MC_FILE.push('function install {')
		for (const id of Object.values(objectives)) {
			MC_FILE.push(`scoreboard objectives add ${id} dummy`)
		}
		MC_FILE.push('}')
	}

	{
		//> Bone Entity type
		MC_FILE.push(`entities bones {
			minecraft:area_effect_cloud
			minecraft:armor_stand
		}`)
	}

	{
		//> Remove dir
		MC_FILE.push('dir remove {')
		{
			//> Remove dir
			MC_FILE.push('function this {')
			MC_FILE.push(
				format(rootEntityCheck, {
					if_root: `
					scoreboard players operation # aj.id = @s aj.id
					execute as @e[type=#example:bone_entities,tag=!${tags.root_entity},tag=${tags.model_identifier},distance=..10] if score @s aj.id = # aj.id run kill @s
					kill @s`,
				})
			)
			MC_FILE.push('}')
		}
		MC_FILE.push('}')
	}

	{
		// Summon Function
		MC_FILE.push('function summon {')

		MC_FILE.push('}')
	}

	Blockbench.writeFile(statueExporterSettings.mcb_file_path, {
		content: fix_indent(MC_FILE),
	})
}

// Old data pack generator
/*
	// THe bIRtH of thE mC fILE
	let MC_FILE = [];

	MC_FILE.push("function load {");
	MC_FILE.push(`\tscoreboard objectives add ${scoreboards.id} dummy`);
	MC_FILE.push("}");

	// Spacer
	MC_FILE.push("");

	// Summon Function
	MC_FILE.push("function summon {");
	// summon the root entity
	MC_FILE.push(
		format(
			"\tsummon area_effect_cloud ~ ~ ~ {Tags:[%InternalTags],Age:-2147483648,Duration:-1,WaitTime:-2147483648}",
			{
				InternalTags: "'" + root_entity.tags.join("','") + "'",
			}
		)
	);
	// Set the ID of the new root entity
	MC_FILE.push(
		`\texecute as @e[type=area_effect_cloud,tag=${tags.root_entity},tag=${tags.new},limit=1,distance=..1] run {`
	);
	MC_FILE.push(
		`\t\texecute store result score @s ${scoreboards.id} run scoreboard players add #aj.last_id ${scoreboards.id} 1`
	);
	MC_FILE.push(`\t\ttag @s remove ${tags.new}`);
	MC_FILE.push(`\t}`);

	// For each bone, summon an armor_stand with the proper rotation and position.
	for (const [bone_name, bone] of Object.entries(animation_bones)) {
		let line = "\t";
		line += format(
			'summon armor_stand ^%PositionX ^%PositionY ^%PositionZ {Tags:[%InternalTags],Marker:1b,NoGravity:1b,ArmorItems:[{},{},{},{id:"%DisplayItem",Count:1b,tag:{CustomModelData:%CustomModelData}}],Pose:{Head:[%RotationXf,%RotationYf,%RotationZf]}}',
			{
				InternalTags:
					"'" +
					bone_entity.tags
						.map((_) => format(_, { bone: bone_name }))
						.join("','") +
					"'",
				DisplayItem: aj_settings.rig_item,
				CustomModelData: bones[bone_name].custom_model_data,
				PositionX: bone.pos.x,
				PositionY: bone.pos.y - 0.5 + .0615,
				PositionZ: bone.pos.z,
				RotationX: bone.rot[2],
				RotationY: bone.rot[1],
				RotationZ: bone.rot[0],
			}
		);

		MC_FILE.push(line);
	}

	MC_FILE.push(
		`\texecute as @e[type=armor_stand,tag=${tags.model},tag=${tags.new},distance=..4] run {`
	);
	MC_FILE.push(
		`\t\tscoreboard players operation @s ${scoreboards.id} = #aj.last_id ${scoreboards.id}`
	);
	MC_FILE.push(`\t\ttag @s remove ${tags.new}`);
	MC_FILE.push("\t}");

	// End Summon Function
	MC_FILE.push("}");

	// Spacer
	MC_FILE.push("");

	// Remove Dir
	MC_FILE.push("dir remove {");
	// Remove all models
	MC_FILE.push("\tfunction all {");
	MC_FILE.push(`\t\tkill @e[tag=${tags.model}]`);
	MC_FILE.push("\t}");
	// Spacer
	MC_FILE.push("");
	// Remove this model
	MC_FILE.push("\tfunction this {");
	MC_FILE.push(
		`\t\tscoreboard players operation #this.id ${scoreboards.id} = @s ${scoreboards.id}`
	);
	MC_FILE.push(
		`\t\texecute as @e[type=armor_stand,tag=${tags.model},distance=..4] if score @s ${scoreboards.id} = #this.id ${scoreboards.id} run kill @s`
	);
	MC_FILE.push(`\t\tkill @s`);
	MC_FILE.push("\t}");
	MC_FILE.push("}");

	console.log(MC_FILE);

	Blockbench.writeFile(statue_exporter_settings.mcb_file_path, {
		content: MC_FILE.join("\n"),
	});
*/

async function statueExport(data) {
	await exportDatapack(
		data.bones,
		data.animations,
		data.settings.animatedJava,
		data.settings.aj_builtin_statue_exporter,
		data.animations
	)

	Blockbench.showQuickMessage('Statue export successful!')
}

const Exporter = (AJ) => {
	AJ.settings.registerPluginSettings('animatedJava_BUILTIN_statueExporter', {
		entityTag: {
			type: 'text',
			default: 'aj.statue.%model_name.%bone_name',
			populate() {
				return 'aj.statue.%model_name.%bone_name'
			},
			isValid(value) {
				return value != ''
			},
			isResetable: true,
		},
		idScoreboardObjective: {
			type: 'text',
			default: 'aj.id',
			populate() {
				return 'aj.id'
			},
			isValid(value) {
				return value != ''
			},
		},
		mcbFilePath: {
			type: 'filepath',
			default: '',
			props: {
				dialogOpts: {
					defaultPath: Project.name + '.mc',
					promptToCreate: true,
					properties: ['openFile'],
				},
			},
			populate() {
				return ''
			},
			isValid(value) {
				return true
			},
		},
	})
	AJ.addExportAction({
		icon: 'info',
		category: 'animated_java.statue_exporter',
		name: 'Statue Exporter',
		id: 'statue_exporter',
		condition: () => AJ.format.id === Format.id,
		click: function () {
			AJ.build(
				(data) => {
					console.log('Input Data:', data)
					statueExport(data)
				},
				{
					generate_static_animation: true,
				}
			)
		},
	})
}
if (window.ANIMATED_JAVA) {
	Exporter(window.ANIMATED_JAVA)
} else {
	Blockbench.on('animated-java-ready', Exporter)
}
