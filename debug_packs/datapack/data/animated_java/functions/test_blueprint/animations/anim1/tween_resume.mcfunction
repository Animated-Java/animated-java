# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
execute unless entity @s[type=item_display,tag=aj.rig_root] run return run \
	function animated_java:global/errors/function_not_executed_as_root_entity \
	{'function_path': 'animated_java:test_blueprint/animations/anim1/tween_resume'}
tag @s add aj.test_blueprint.animation.anim1.tween_playing