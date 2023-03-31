# Important
- [x] Try decomposed transformation instead of matrix

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
- [x] Add accessability options
    - [x] Option to disable all UI animations
- [x] The setting description scales weirdly. Make it not do that
- [x] ~~Overwrite the rotation limits dialog~~ Create a new rotation limits dialog with a more accurate description for AJ's models.
- [x] Add a popup over the canvas that tells the user why their cubes are red
- [x] Settings UI needs to display the selected exporter's settings

# Settings
- [x] The animation exporter setting should not select based on exporter intex. It should be based on exporter ID - Fixed by adding a function to all settings that translates from a saved value to the run-time value.

# Docs
- [x] The documentation needs to pull from the website when building for prod, and localhost when building for dev

# About Page

# Animation Exporter
- [x] Add a way to summon a model with a specific variant
- [x] Make sure the animations take Affected Bones into account.

# Model verification
- [x] On load make sure all bone names are valid
- [x] Enforce 20 fps animation snapping, and round all keyframes to their nearest valid value.
- [x] Update all instruction keyframes to commands keyframes
- [x] Update all old variants if possible

# Main Animated Java Features
- [x] Textures should be allowed anywhere on the system. AJ should instead put them into the generated resource pack automatically when exporting.
- [x] Add a list of bones to the variant properties dialog.
    - [x] Add a checkbox that when enabled turns the list into a whitelist.
    - [x] The variant should only modify bones according to the list. For instance, If it's a whitelist the variant will only modify the bones in the list. Not touching the textures of other bones.
- [x] Bones should be forced to have safe function names instead of being changed on export.
- [x] We should check that all cubes are valid before exporting.
- [x] Show invalid element rotations with a red outline around the element.
- [x] Animations
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
