# Important
- [ ] Try decomposed transformation instead of matrix

# UI
- [ ] Settings should debounce the onUpdate function instead of the infoPopup variable
- [x] Replace default animation creation and config screens
- [x] Variants panel
    - [x] Component and mounting
    - [x] Project based texture map
    - [x] Button to add new Variant
    - [x] ~~Double click variant~~ (or press the edit button) to open the Variants Dialog
- [x] Variants Dialog
    - [x] Change the name of the variant
    - [x] Configure texture map
- [x] Variants rendering
    - [x] Need a function that sets the textures of a model based on a provided variant
    - [x] Change textures based on which variant is selected
    - [x] Change variant in animator based on keyframes
- [x] CodeboxSetting setting type
- [ ] Add accessability options
    - [ ] Option to disable all UI animations
- [x] The setting description scales weirdly. Make it not do that
- [x] ~~Overwrite the rotation limits dialog~~ Create a new rotation limits dialog with a more accurate description for AJ's models.
- [x] Add a popup over the canvas that tells the user why their cubes are red
- [x] Settings UI needs to display the selected exporter's settings

# Settings
- [x] The animation exporter setting should not select based on exporter intex. It should be based on exporter ID - Fixed by adding a function to all settings that translates from a saved value to the run-time value.

# Docs
- [ ] The documentation needs to pull from the website when building for prod, and localhost when building for dev
- [ ] F-A-Q

# About Page
- [ ] Make this
- [ ] Include a small gif of SnaveSutit smashing a keyboard

# Animation Exporter
- [ ] Add an uninstall function
- [ ] Reset function for each animation and for default pose.
    - [ ] When called for an animation it should set the pose to the first frame of the animation
- [ ] Figure out a clever way to allow summoning a rig at any frame in any animation
- [x] Add a way to summon a model with a specific variant
- [ ] Keyframes need to be deduplicated, otherwise a weird vibration effect occurrs
- [ ] Add a "version" id of some kind to each model when it get summoned.
    - [ ] The version changes every time you export
    - [ ] When the load function runs, and every second or so, check all active rig verison ids against the current version id. If the ids are different, update the rig to the latest verision.
    - [ ] Update CustomModelData
    - [ ] Update interpolation_duration
- [ ] Make sure the animations take Affected Bones into account.
- [ ] Empty bones shouldn't be exported

# Model verification
- [x] On load make sure all bone names are valid
- [x] Enforce 20 fps animation snapping, and round all keyframes to their nearest valid value.
- [x] Update all instruction keyframes to commands keyframes
- [x] Update all old variants if possible

# Main Animated Java Features
- [ ] Keyframe properties menu
    - [ ] More spacious command editing UI
    - [ ] Per-keyframe interpolation duration
- [ ] While rendering animations we should be updating the progress bar based on how many frames are left, not just based on how many animations are left
- [ ] The Blockbench preview should take affected bones into account and somehow visually show that they aren't being effected.
    - [ ] Instead of using a "Affected Bones" list, we should use a button on each group in the outliner. This will be easier to configure and will probably be more intuitive.
- [ ] Textures should be allowed anywhere on the system. AJ should instead put them into the generated resource pack automatically when exporting.
- [ ] Animation State Keyframes should allow you to choose whether to play the animation from the start, or from the current anim_time
- [x] Add a list of bones to the variant properties dialog.
    - [x] Add a checkbox that when enabled turns the list into a whitelist.
    - [x] The variant should only modify bones according to the list. For instance, If it's a whitelist the variant will only modify the bones in the list. Not touching the textures of other bones.
- [ ] There should be tick, load, summon, and remove function tags in the animation and statue exporter.
    - [ ] tick
    - [ ] load
    - [x] summon
    - [ ] remove
- [x] Bones should be forced to have safe function names instead of being changed on export.
- [x] We should check that all cubes are valid before exporting.
- [ ] Use modify item to replace display items
- [x] Show invalid element rotations with a red outline around the element.
- [ ] Unknown Error Dialog
- [ ] Animation Caching
- [ ] Warn users if they have bones spinning faster than 180. Since it may cause interpolation shenanigans
- [ ] Locators
    - [ ] Exported locators position a tagged entity with the same aj.id
- [ ] Cameras
    - [ ] Just fancy locators with x and y rotation support
- [ ] Exporters ready for 1.0 release
    - [ ] Animation Exporter
    - [ ] Statue Exporter
    - [ ] Raw Exporter
- [ ] Predicate Item Merging
- [ ] Bone Config
    - [ ] Custom display item NBT
    - [ ] Per-Variant display item NBT
- [ ] Animations
    - [ ] Animation "State" - Based on a score on the root entity, automatically switch between animations.
        - [ ] If animation_state is set to -1 no animations will play. This is also the default value of animation_state.
    - [ ] Animation *Transitioning*
        - [ ] When switching active animations, if an animation is already running, blend between it's current frame and the other animation's next frame.
        - [ ] Add some way to choose blend duration.
        - [ ] Add some way to disable blending.
    - [x] Keyframes for swapping from one animation to another (Animation State Keyframes)
    - [x] Keyframes for Variant swaps
    - [x] Variant swap keyframe `execute if` condition. Only swap variants if a condition is met on the root entity.
    - [x] Animation State keyframe `execute if` condition. Only swap states if a condition is met on the root entity.
    - [x] Add a keyframe timeline to every bone for running commands at that bone
- [x] Things to convert when converting model formats into AJ's format
    - [x] All animations need their snapping set to 20
    - [x] Animation Keyframes need to be rounded to the nearest 20th of a second
- [x] Add some way to have the rig follow the root even while it's not animating.
    - ~~Possible solution~~ Solution: Make all display entities ride the root entity.
- [x] Make sure loop delay and start delay (in the animation properties menu) are taken into account by AJ when parsing animations.
- [x] Remove install and just update variables on reload/summon.
- [x] Add a way to adjust an animation's control over bones
    - [x] Affected Bones
    - [x] Affected Bones is a Whitelist

# Post-1.0
- [ ] Animation controller support?
- [ ] Armor Stand animation exporter?
- [ ] Stable Player Display support? (https://github.com/bradleyq/stable_player_display)