
function install {

	scoreboard objectives add aj.i dummy
	scoreboard objectives add aj.id dummy
	scoreboard objectives add aj.frame dummy

}

entities bone_entities {
	minecraft:armor_stand,
	minecraft:area_effect_cloud
}

# Resets the model to it's initial summon position/rotation
function reset_model {
	# Make sure this function has been ran as the root entity
	execute(if entity @s[tag=aj.example.root]) {
		# Remove all animation tags
		tag @s remove aj.example.anim.example_1
		# tag @s remove aj.example.anim.example_2
		# Reset animation time
		scoreboard players set @s aj.frame 0
		# load initial animation frame
		function example:animations/example_1/next_frame
		# Reset animation time
		scoreboard players set @s aj.frame 0

	# If this entity is not the root
	} else {
		tellraw @s "Root execution error!"
	}
}

dir remove {
	# Resets the model to it's initial summon state
	function this {
		# Make sure this function has been ran as the root entity
		execute(if entity @s[tag=aj.example.root]) {
			scoreboard players operation # aj.id = @s aj.id
			execute as @e[type=#example:bone_entities,tag=aj.example,distance=..10] if score @s aj.id = # aj.id run kill @s

			kill @s

		# If this entity is not the root
		} else {
			tellraw @s "Root execution error!"
		}
	}

	# Resets the model to it's initial summon state
	function all {
		kill @e[type=#example:bone_entities,tag=aj.example]
	}
}

# Controls the animations of the model
function anim_loop {
	# Schedule clock
	schedule function example:control/anim_loop 1t
	# Set anim_loop active flag to true
	scoreboard players set #aj.example aj.i 1
	# Reset animating flag
	scoreboard players set #animating aj.i 0
	# Run animations that are active on the entity
	execute as @e[type=minecraft:armor_stand,tag=aj.example.root] run{
		execute if entity @s[tag=aj.example.anim.example_1] run function example:animations/example_1/next_frame
		# execute if entity @s[tag=aj.example.anim.example_2] run function example:animations/example_2/next_frame
	}
	# Stop the anim_loop clock if no models are animating
	execute if score #animating aj.i matches 0 run {
		# Stop anim_loop shedule clock
		schedule clear example:control/anim_loop
		# Set anim_loop active flag to false
		scoreboard players set #aj.example aj.i 0
	}
}
