# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
# Args: {confirm: boolean}
$execute if score aj.$(confirm) aj.i matches 0 run tellraw @a 'Are you sure you want to remove all Animated Java rigs from the world? Run this command again with {confirm:true} to confirm.'
$execute if score aj.$(confirm) aj.i matches 1 run function animated_java:test_blueprint/remove/zzz/5