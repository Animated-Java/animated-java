# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
execute if data storage aj:temp {args:{variant:''}} run return run tellraw @a "The variant argument cannot be an empty string."
# Attempt to apply the variant, if it fails, print an error.
execute store success score #success aj.i run function animated_java:test_blueprint2/zzz/8 with storage aj:temp args
$execute unless score #success aj.i matches 1 run return run tellraw @a "The variant $(variant) does not exist."