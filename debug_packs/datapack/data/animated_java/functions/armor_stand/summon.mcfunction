# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
#Args: {args:{variant: string, animation: string, frame: int, start_animation: boolean}}
# frame is ignored unless animation is specified.
data modify storage aj:temp args set value {variant:'', animation:'', frame: 0}
$execute store success score #success aj.i run data modify storage aj:temp args set value $(args)
summon minecraft:item_display ~ ~ ~ { teleport_duration: 1, interpolation_duration: 1, Tags:['aj.new','aj.rig_entity','aj.rig_root','aj.armor_stand.root'], Passengers:[{id:"minecraft:item_display",Tags:["aj.rig_entity","aj.bone","aj.armor_stand.bone","aj.armor_stand.bone.baseplate_pivot_a"],transformation:{translation:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[0f,0f,0f]},interpolation_duration:1,teleport_duration:1,item_display:"head",item:{id:"minecraft:white_dye",count:1,components:{"minecraft:custom_model_data":49}},height:100f,width:100f},{id:"minecraft:item_display",Tags:["aj.rig_entity","aj.bone","aj.armor_stand.bone","aj.armor_stand.bone.head"],transformation:{translation:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[0f,0f,0f]},interpolation_duration:1,teleport_duration:1,item_display:"head",item:{id:"minecraft:white_dye",count:1,components:{"minecraft:custom_model_data":50}},height:100f,width:100f},{id:"minecraft:item_display",Tags:["aj.rig_entity","aj.bone","aj.armor_stand.bone","aj.armor_stand.bone.left_arm"],transformation:{translation:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[0f,0f,0f]},interpolation_duration:1,teleport_duration:1,item_display:"head",item:{id:"minecraft:white_dye",count:1,components:{"minecraft:custom_model_data":51}},height:100f,width:100f},{id:"minecraft:item_display",Tags:["aj.rig_entity","aj.bone","aj.armor_stand.bone","aj.armor_stand.bone.right_arm"],transformation:{translation:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[0f,0f,0f]},interpolation_duration:1,teleport_duration:1,item_display:"head",item:{id:"minecraft:white_dye",count:1,components:{"minecraft:custom_model_data":52}},height:100f,width:100f},{id:"minecraft:item_display",Tags:["aj.rig_entity","aj.bone","aj.armor_stand.bone","aj.armor_stand.bone.body"],transformation:{translation:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[0f,0f,0f]},interpolation_duration:1,teleport_duration:1,item_display:"head",item:{id:"minecraft:white_dye",count:1,components:{"minecraft:custom_model_data":53}},height:100f,width:100f},{id:"minecraft:item_display",Tags:["aj.rig_entity","aj.bone","aj.armor_stand.bone","aj.armor_stand.bone.right_leg2"],transformation:{translation:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[0f,0f,0f]},interpolation_duration:1,teleport_duration:1,item_display:"head",item:{id:"minecraft:white_dye",count:1,components:{"minecraft:custom_model_data":54}},height:100f,width:100f},{id:"minecraft:item_display",Tags:["aj.rig_entity","aj.bone","aj.armor_stand.bone","aj.armor_stand.bone.left_leg"],transformation:{translation:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[0f,0f,0f]},interpolation_duration:1,teleport_duration:1,item_display:"head",item:{id:"minecraft:white_dye",count:1,components:{"minecraft:custom_model_data":55}},height:100f,width:100f}] }
execute as @e[type=item_display,tag=aj.new,limit=1,distance=..0.01] run function animated_java:armor_stand/zzz/0