# IMPORTANT
- [x] Message Boq with any issues regarding interpolation jitter and entity rotation interpolation.

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

# Docs
- [ ] F-A-Q

# About Page
- [ ] Include a small gif of SnaveSutit smashing a keyboard

# Features
- [ ] ~~Bones should have a tick function in their bone-config~~ There should be a function tag that runs on every bone every tick
- [ ] There should be tick, load, summon, and remove function settings in the animation and statue exporter.
- [ ] Bones should be forced to have safe function names instead of being changed on export.
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
- [ ] Exporters
    - [ ] Animation Exporter
    - [ ] Statue Exporter
    - [ ] Raw Exporter
- [ ] Predicate Item Merging
- [ ] Bone Config
    - [ ] Custom display item NBT
    - [ ] Per-Variant display item NBT
- [ ] Animations
    - [ ] Animation "State" - Based on a score on the root entity, automatically switch between animations.
    - [ ] Animation *Blending*
        - [ ] When switching active animations, if an animation is already running, blend between it's current frame and the next frame.
        - [ ] Add some way to choose blend duration.
        - [ ] Add some way to disable blending.
    - [x] Keyframes for swapping from one animation to another (Animation State Keyframes)
    - [x] Keyframes for Variant swaps
    - [x] Variant swap keyframe `execute if` condition. Only swap variants if a condition is met on the root entity.
    - [x] Animation State keyframe `execute if` condition. Only swap states if a condition is met on the root entity.
    - [x] Add a keyframe timeline to every bone for running commands at that bone
- [ ] Things to convert when converting model formats into AJ's format
    - [ ] All animations need their snapping set to 20
    - [ ] Animation Keyframes need to be rounded to the nearest 20th of a second
- [x] Add some way to have the rig follow the root even while it's not animating.
    - ~~Possible solution~~ Solution: Make all display entities ride the root entity.
- [x] Make sure loop delay and start delay (in the animation properties menu) are taken into account by AJ when parsing animations.
- [x] Remove install and just update variables on reload/summon.
- [ ] Add a way to adjust an animation's control over bones:
    - [ ] Three global options
        - [ ] This animation controls all bones in the model
        - [ ] This animation resets all bones to it's default pose when played, but then acts like option 3
        - [ ] This animation controls only bones it actually animates
    - [ ] And 3 bone config options
        - [ ] Use global setting
        - [ ] This bone resets every time an animation is started via the play function
        - [ ] This bone is not animated by any animations

# Post-1.0
- [ ] Animation controller support?
- [ ] Armor Stand animation exporter