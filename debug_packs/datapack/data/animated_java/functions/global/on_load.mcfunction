# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
# Initialize Scoreboards
scoreboard objectives add aj.i dummy
scoreboard objectives add aj.id dummy
scoreboard objectives add aj.frame dummy
scoreboard objectives add aj.is_rig_loaded dummy
scoreboard objectives add aj.tween_duration dummy
scoreboard players set aj.1b aj.i 1
scoreboard players set aj.0b aj.i 0
scoreboard players add aj.last_id aj.id 0
# Initialize Storage
data modify storage aj:temp args set value {}
scoreboard players reset * aj.is_rig_loaded
execute as @e[type=item_display,tag=aj.rig_root] unless score @s aj.is_rig_loaded matches 1 at @s run function #animated_java:global/root/on_load
# Initialize Rigs
function #animated_java:global/on_load