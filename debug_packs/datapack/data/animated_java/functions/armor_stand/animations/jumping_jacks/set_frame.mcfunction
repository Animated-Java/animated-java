# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
# Sets the frame without interpolation
#ARGS: {frame: int}
execute unless entity @s[type=item_display,tag=aj.armor_stand.root] run return run function animated_java:global/errors/function_not_executed_as_root_entity {'function_path': 'animated_java:armor_stand/animations/jumping_jacks/set_frame'}
$execute store result storage aj:temp frame int 1 run scoreboard players set @s aj.frame $(frame)
function animated_java:armor_stand/animations/jumping_jacks/zzz/set_frame with storage aj:temp