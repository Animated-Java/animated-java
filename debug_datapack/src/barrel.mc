function install {
	scoreboard objectives add aj.i dummy
	scoreboard objectives add aj.id dummy
	scoreboard objectives add aj.frame dummy
}
entities bones {
	minecraft:area_effect_cloud
	minecraft:armor_stand
}
dir remove {
	function this {
		execute (if entity @s[tag=aj.example.root]) {
			scoreboard players operation # aj.id = @s aj.id
			execute as @e[type=#example:bone_entities,tag=aj.example,distance=..10] if score @s aj.id = # aj.id run kill @s
			kill @s
		} else {
			tellraw @s "Root execution error!"
		}
	}
}
dir summon {
	function default {
		summon minecraft:marker ~ ~ ~ {Tags:['aj.example', 'aj.example.root', 'new']}
		execute as @e[type=marker,tag=aj.example.root,tag=new,distance=..1,limit=1] at @s rotated ~ 0 run {
			execute store result score @s aj.id run scoreboard players add .aj.last_id aj.i 1

			summon minecraft:area_effect_cloud ^ ^ ^ {Tags:['aj.example', 'aj.example.bone', 'aj.example.boneA', 'new'],Passengers:[{id:"minecraft:armor_stand",Tags:['aj.example', 'aj.example.bone_model', 'new']}],Age:-2147483648,Duration:-1,WaitTime:-2147483648}
			summon minecraft:area_effect_cloud ^ ^ ^ {Tags:['aj.example', 'aj.example.bone', 'aj.example.boneB', 'new'],Passengers:[{id:"minecraft:armor_stand",Tags:['aj.example', 'aj.example.bone_model', 'new']}],Age:-2147483648,Duration:-1,WaitTime:-2147483648}
			summon minecraft:area_effect_cloud ^ ^ ^ {Tags:['aj.example', 'aj.example.bone', 'aj.example.boneC', 'new'],Passengers:[{id:"minecraft:armor_stand",Tags:['aj.example', 'aj.example.bone_model', 'new']}],Age:-2147483648,Duration:-1,WaitTime:-2147483648}

			execute as @e[type=#example:bone_entities,tag=aj.example,tag=new,distance=..10] positioned as @s run {
				scoreboard players operation @s aj.id = .aj.last_id aj.i
				tp @s ~ ~ ~ ~ ~
				tag @s remove new
			}

			tag @s remove new
		}
	}
}
