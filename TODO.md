
# Features
- Add some way to have the rig follow the root even while it's not animating.
- Make sure loop delay and start delay (in the animation properties menu) are taken into account by AJ when parsing animations.
- Remove install and just update variables on reload/summon.
- Add a way to adjust an animation's control over bones:
    - Three global options
        - This animation controls all bones in the model
        - This animation resets all bones to it's default pose when played, but then acts like option 3
        - This animation controls only bones it actually animates
    - And 3 bone config options
        - Use global setting
        - This bone resets every time an animation is started via the play function
        - This bone is not animated by any animations