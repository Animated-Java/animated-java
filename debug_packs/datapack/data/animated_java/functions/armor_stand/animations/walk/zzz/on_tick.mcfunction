# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
data modify storage aj:temp frame set value 0
execute store result storage aj:temp frame int 1 run scoreboard players add @s aj.frame 1
function animated_java:armor_stand/animations/walk/zzz/apply_frame with storage aj:temp
execute if score @s aj.frame matches 20.. run scoreboard players set @s aj.frame -1