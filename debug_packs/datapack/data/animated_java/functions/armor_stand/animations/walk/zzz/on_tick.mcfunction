# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
# Tweening logic
scoreboard players remove @s aj.tween_duration 1
execute if score @s aj.tween_duration matches 1.. run return 1
execute if score @s aj.tween_duration matches 0 on passengers run data modify entity @s interpolation_duration set value 1
# Animation logic
execute store result storage aj:temp frame int 1 run scoreboard players get @s aj.frame
function animated_java:armor_stand/animations/walk/zzz/apply_frame with storage aj:temp
execute if score @s aj.frame matches 20.. run scoreboard players set @s aj.frame 0
scoreboard players add @s aj.frame 1