# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.
execute unless entity @s[type=item_display,tag=aj.root_entity] run return run \
	function *global/errors/function_not_executed_as_root_entity \
	{'function_path': 'animated_java:test_blueprint2/animations/anim1/tween_resume'}
tag @s add aj.test_blueprint2.animation.anim1.tween_playing