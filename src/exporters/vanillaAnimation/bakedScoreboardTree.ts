import * as aj from '../../animatedJava'
import * as mc from '../../util/minecraft'
import { JsonText, Scoreboard, ScoreboardObjective } from '../../util/minecraft'
import { fixIndent, format, safeFunctionName } from '../../util/replace'
import { VanillaAnimation } from './entry'

export function generate(): string {
	const FILE: string[] = []

	const staticAnimUUID = ANIMATED_JAVA.store.get('staticAnimationUuid')
	const animations = Object.fromEntries(Object.entries(VanillaAnimation.exportData.animations).filter(v => v[0] !== staticAnimUUID))

	const cleanProjectName = safeFunctionName(VanillaAnimation.ajSettings.projectName)

	const storageKey = 'aj.%projectName:ram'
	const scoreboard = new mc.Scoreboard(
		{
			id: new mc.ScoreboardObjective('aj.id', 'dummy', new JsonText({ text: '%name', color: '#00aced' })),
			internal: new mc.ScoreboardObjective('aj.i', 'dummy', new JsonText({ text: '%name', color: '#00aced' })),
		},
		{
			model: 'aj.%projectName',
			rootEntity: 'aj.%projectName',
			anyBone: 'aj.%projectName.bone',
			specificBone: 'aj.%projectName.bone.%boneName',
		}
	)
	// TODO add scoreboard config options
	for (const [_, animation] of Object.entries(animations)) {
		scoreboard.addObj(`${animation.name}Frame`, new ScoreboardObjective(`aj.%projectName.anim.${animation.name}.frame`, 'dummy', new JsonText({ text: '%name', color: '#00aced' })))
		scoreboard.addObj(`${animation.name}LoopMode`, new ScoreboardObjective(`aj.%projectName.anim.${animation.name}.loopMode`, 'dummy', new JsonText({ text: '%name', color: '#00aced' })))
	}

	// TODO make this include custom bone entity types
	FILE.push(`entities bones {
		minecraft:area_effect_cloud
		minecraft:armor_stand
	}`)

	{
		// install function
		// TODO Make this message prettier!
		const manualInstallMessage = new JsonText({
			text: 'AJ automatically handles installation. Running this function manually is not recommended.',
		})

		FILE.push(`function install {
			${Object.values(scoreboard.obj)
				.map(v => v.createString())
				.join('\n')}
			execute if entity @s[type=player] run tellraw @s ${manualInstallMessage}
			data modify storage ${storageKey} installed set value true
		}`)
	}

	{
		// load function
		FILE.push(`function load {
			execute if data storage ${storageKey} {installed:true} run function %projectName:internal/check_install
			execute unless data storage ${storageKey} {installed:true} run function %projectName:install
		}`)
	}

	{
		// uninstall function
		FILE.push(`function uninstall {
			${Object.entries(scoreboard.obj)
				.filter(([k, _]) => k !== 'id' && k !== 'internal')
				.map(([_, v]) => v.removeString())
				.join('\n')}
		}`)
	}

	{
		// summon functions
		FILE.push(`dir summon {`)

		for (const [variantName, variant] of Object.entries(VanillaAnimation.variants)) {}

		FILE.push(`}`) // dir summon
	}

	FILE.push(`dir internal {`)

	{
		// check_install function
		FILE.push(`function check_install {
			scoreboard objectives add aj.validator dummy
			scoreboard players set # aj.validator 1
			${Object.values(scoreboard.obj)
				.map(v => `execute if score # aj.validator matches 1 store success score # aj.validator run scoreboard players reset # ${v}`)
				.join('\n')}
			execute if score # aj.validator matches 0 run function %projectName:install
			scoreboard objectives remove aj.validator
		}`)
	}

	FILE.push(`}`) // dir internal

	return format(fixIndent(FILE), { projectName: cleanProjectName })
}
