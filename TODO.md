
# UI
- [x] Replace default animation creation and config screens
- [ ] Variants panel
    - [ ] Texture map is controlled and verified by the UI. A copy of the map is then put into Project.animated_java_variants.texture_map

# Features
- [ ] Things to convert when converting model formats into AJ's format
    - [ ] All animations need their snapping set to 20
    - [ ] Animation Keyframes need to be rounded to the nearest 20th of a second
- [ ] Add some way to have the rig follow the root even while it's not animating.
    - Possible solution: Make all display entities ride the root entity.
- [x] Make sure loop delay and start delay (in the animation properties menu) are taken into account by AJ when parsing animations.
- [ ] Remove install and just update variables on reload/summon.
- [ ] Add a way to adjust an animation's control over bones:
    - [ ] Three global options
        - [ ] This animation controls all bones in the model
        - [ ] This animation resets all bones to it's default pose when played, but then acts like option 3
        - [ ] This animation controls only bones it actually animates
    - [ ] And 3 bone config options
        - [ ] Use global setting
        - [ ] This bone resets every time an animation is started via the play function
        - [ ] This bone is not animated by any animations