# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
# It's actually faster to use an on passeners call that checks tag immediately
# than to spread it into a function that runs a bunch of tag checks on each bone.
execute on passengers if entity @s[tag=aj.armor_stand.bone.head] run data merge entity @s {transformation: [-1f,0f,1.2246467991473532e-16f,-0.2763157894736841f,0f,1f,0f,0.8486842105263158f,-1.2246467991473532e-16f,0f,-1f,-0.31250000000000006f,0f,0f,0f,1f], start_interpolation: 0}