# Starts the animation
function play {
	# Make sure this function has been ran as the root entity
	execute(if entity @s[tag=aj.example.root]) {
		# Add animation tag
		tag @s add aj.example.anim.example_1
		# Reset animation time
		scoreboard players set @s aj.frame 0
		# Start the animation loop if not running
		function example:control/anim_loop
	# If this entity is not the root
	} else {
		tellraw @s "Root execution error!"
	}
}

# Stops the animation and resets to first frame
function stop {
	# Make sure this function has been ran as the root entity
	execute(if entity @s[tag=aj.example.root]) {
		# Add animation tag
		tag @s remove aj.example.anim.example_1
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

# Pauses the animation on the current frame
function pause {
	# Make sure this function has been ran as the root entity
	execute(if entity @s[tag=aj.example.root]) {
		# Remove animation tag
		tag @s remove aj.example.anim.example_1
	# If this entity is not the root
	} else {
		tellraw @s "Root execution error!"
	}
}

# Resumes the animation from it's current frame
function resume {
	# Make sure this function has been ran as the root entity
	execute(if entity @s[tag=aj.example.root]) {
		# Remove animation tag
		tag @s add aj.example.anim.example_1
		# Start the animation loop
		function example:control/anim_loop
	# If this entity is not the root
	} else {
		tellraw @s "Root execution error!"
	}
}

# Plays the next frame in the animation
function next_frame {

	scoreboard players operation .this aj.frame = @s aj.frame
	scoreboard players operation .this aj.id = @s aj.id
	execute as @e[type=#example:bone_entities,tag=aj.example,distance=..10] if score @s aj.id = .this aj.id run {
		# Split by type
		execute if entity @s[type=minecraft:area_effect_cloud] run {
			# Split by bone
			execute if entity @s[tag=aj.example.head] run {
				# Split by frame
				execute if score .this aj.frame matches 0..7 run {
					execute if score .this aj.frame matches 0 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 1 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 2 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 3 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 4 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 5 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 6 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 7 run tp @s ^ ^ ^ ~ ~
				}
				execute if score .this aj.frame matches 8..15 run {
					execute if score .this aj.frame matches 8 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 9 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 10 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 11 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 12 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 13 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 14 run tp @s ^ ^ ^ ~ ~
					execute if score .this aj.frame matches 15 run tp @s ^ ^ ^ ~ ~
				}
			}
			execute store result entity @s Air short 1 run scoreboard players get @s aj.frame
		}
		# Split by type
		execute if entity @s[type=minecraft:armor_stand] run {
			# Split by bone
			execute if entity @s[tag=aj.example.head] run {
				# Split by frame
				execute if score .this aj.frame matches 0..7 run {
					execute if score .this aj.frame matches 0 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 1 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 2 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 3 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 4 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 5 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 6 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 7 run data modify entity @s Pose.Head set value [0f,0f,0f]
				}
				execute if score .this aj.frame matches 8..15 run {
					execute if score .this aj.frame matches 8 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 9 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 10 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 11 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 12 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 13 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 14 run data modify entity @s Pose.Head set value [0f,0f,0f]
					execute if score .this aj.frame matches 15 run data modify entity @s Pose.Head set value [0f,0f,0f]
				}
			}
		}
	}

	# Increment frame
	scoreboard players add @s aj.frame 1
	# Let the anim_loop know we're still running
	scoreboard players set #animating aj.i 1
	# If (the next frame is the end of the animation) perform the necessary actions for the loop mode of the animation
	execute if score @s aj.frame matches 10.. run function example:animations/example_1/end_animation
}
# Performs a loop mode action depending on what the animation's configured loop mode is
function end_animation {
	# Play Once
	execute if score @s aj.example.example_1.loopMode matches 0 run {
		function example:animations/example_1/stop
	}
	# Hold on last frame
	execute if score @s aj.example.example_1.loopMode matches 1 run {
		function example:animations/example_1/pause
	}
	# loop
	execute if score @s aj.example.example_1.loopMode matches 2 run {
		scoreboard players set @s aj.frame 0
	}
}
