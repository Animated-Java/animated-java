# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
execute unless entity @s[type=item_display,tag=aj.armor_stand.root] run return run function animated_java:global/errors/function_not_executed_as_root_entity {'function_path': 'animated_java:armor_stand/animations/jumping_jacks/play'}
tag @s add aj.armor_stand.animation.jumping_jacks.playing
scoreboard players set @s aj.frame 1
function animated_java:armor_stand/animations/jumping_jacks/zzz/set_frame {frame: 1}