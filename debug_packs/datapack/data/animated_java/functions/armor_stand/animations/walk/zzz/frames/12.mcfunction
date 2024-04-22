# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
# It's actually faster to use a single command like this than to spread it into a function.
execute on passengers if entity @s[tag=aj.armor_stand.bone.head] run \
	data merge entity @s {transformation: [-0.9990808591873064f,-0.024904163198266598f,0.03488867238729723f,-0.019418286982843366f,-0.02488899225493418f,0.9996898432290858f,0.0008691427614164497f,1.466978680536724f,-0.034899496702501004f,-3.04988037462005e-18f,-0.9993908270190958f,-2.3780542998463843e-18f,0f,0f,0f,1f], start_interpolation: 0}
# It's actually faster to use a single command like this than to spread it into a function.
execute on passengers if entity @s[tag=aj.armor_stand.bone.left_arm] run \
	data merge entity @s {transformation: [-0.9164286958649848f,0.3669657613649898f,0.15967020818241864f,0.48529382290670536f,0.3599721903758794f,0.9301973494144598f,-0.07178379551336754f,1.4795520129937492f,-0.17486699960597246f,-0.008307895529356263f,-0.9845570127324664f,0.022492269187677282f,0f,0f,0f,1f], start_interpolation: 0}
# It's actually faster to use a single command like this than to spread it into a function.
execute on passengers if entity @s[tag=aj.armor_stand.bone.right_arm] run \
	data merge entity @s {transformation: [-0.9918353626756324f,0.12153119299390161f,0.03863654326638974f,-0.3875256483723865f,0.11090695700399258f,0.9715929907940741f,-0.2090614912602057f,1.4578084305190615f,-0.06294648706807314f,-0.2030695185627463f,-0.9771389411933614f,-0.07097800367326415f,0f,0f,0f,1f], start_interpolation: 0}
# It's actually faster to use a single command like this than to spread it into a function.
execute on passengers if entity @s[tag=aj.armor_stand.bone.body] run \
	data merge entity @s {transformation: [-0.981619630372115f,-0.024904163198266598f,0.18921597163957043f,-0.02097479718273503f,-0.024454000047099828f,0.9996898432290858f,0.004713727431909694f,1.5294592957385418f,-0.18927467646203772f,-3.04988037462005e-18f,-0.9819241808053161f,-2.5686718232601375e-18f,0f,0f,0f,1f], start_interpolation: 0}
# It's actually faster to use a single command like this than to spread it into a function.
execute on passengers if entity @s[tag=aj.armor_stand.bone.right_leg2] run \
	data merge entity @s {transformation: [-1f,-2.8017286959769026e-17f,1.192167331293411e-16f,-0.125f,0f,0.9734785018206427f,0.22877850968357366f,0.6875f,-1.2246467991473532e-16f,0.22877850968357366f,-0.9734785018206427f,-0.03673657826827958f,0f,0f,0f,1f], start_interpolation: 0}
# It's actually faster to use a single command like this than to spread it into a function.
execute on passengers if entity @s[tag=aj.armor_stand.bone.left_leg] run \
	data merge entity @s {transformation: [-1f,2.8017286959769026e-17f,1.192167331293411e-16f,0.125f,0f,0.9734785018206427f,-0.22877850968357366f,0.7886271242968684f,-1.2246467991473532e-16f,-0.22877850968357366f,-0.9734785018206427f,0.03673657826827958f,0f,0f,0f,1f], start_interpolation: 0}
# execute on passengers run {
# 	REPEAT (frame.nodes) as node {
# 		IF (node.type === 'bone') {
# 			execute if entity @s[tag=<%TAGS.LOCAL_BONE_ENTITY(export_namespace, node.name)%>] run \
	# 				data merge entity @s {transformation: <%matrixToNbtFloatArray(node.matrix).toString()%>, start_interpolation: 0}
# 		}
# 	}
# }