# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
$execute store success score #success aj.i run function animated_java:armor_stand/animations/$(animation)/zzz/set_frame with storage aj:temp args
execute if score #success aj.i matches 1 run return 1
return fail