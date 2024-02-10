# Global scoreboards initialized here
scoreboard objectives add aj.i dummy
scoreboard objectives add aj.id dummy
scoreboard objectives add aj.frame dummy
scoreboard objectives add aj.rig_is_loaded dummy

scoreboard players reset * aj.rig_is_loaded
execute as @e[type=minecraft:item_display,tag=aj.root_entity] at @s run function #animated_java:global/root_entity/on_load
