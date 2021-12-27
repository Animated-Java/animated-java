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

	scoreboard players operation # aj.id = @s aj.id
	execute as @e[type=area_effect_cloud,tag=aj.example,distance=..10] if score @s aj.id = # aj.id run {
		execute if entity @s[tag=aj.example.head] run say Animation tree goes here
		execute if entity @s[tag=aj.example.core] run say Animation tree goes here

		execute store result entity @s Air short 1 run scoreboard players get @s aj.frame
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
