# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
# Initialize Scoreboards
scoreboard objectives add aj.i dummy
scoreboard objectives add aj.id dummy
scoreboard objectives add aj.frame dummy
scoreboard objectives add aj.rig_is_loaded dummy
scoreboard players set aj.true aj.i 1
scoreboard players set aj.false aj.i 0
scoreboard players add aj.last_id aj.id 0
scoreboard players reset * aj.rig_is_loaded
execute as @e[type=item_display,tag=aj.root_entity] unless score @s aj.rig_is_loaded matches 1 at @s run function #animated_java:global/root_entity/on_load