
# Ideas for 1.20.2
- Create an NBT list of all summoned AnimatedJava root entity UUIDs and use those instead of using @e selectors to select them.
    - Should compare performance of this vs the single @e selector to make sure it's actually faster. It will probably be faster when selecting AJ models in a heavily entity populated server, but slightly slower at smaller scales.
- Remove the need for a scoreboard tree for selecting/applying next frame of animation.
- Remove scoreboard arguments in favor of function arguments.
- 
