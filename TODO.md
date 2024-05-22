
# Blockbench
- [x] ~~Add a root NBT blueprint setting~~ Add a custom summon commands setting.
- [x] Custom animation properties dialog
- [x] Prevent the user setting their export namespace to 'global' or 'minecraft'
- [x] Add affected bones list to variant, and animation properties.
    - [x] Variant Properties
    - [x] Animation Properties
- [x] Implement .ajmodel to blueprint conversion.
- [x] Change .ajmeta to use relative file paths.
- [x] Resolve env variables in blueprint settings.
- [x] Add renderbox options to the blueprint settings.
- [x] Render and handle invalid cubes with a red outline.
- [x] Force animations to be at least 1 tick long
- [x] Respect Variant inheritance when applying variants in the animation preview.
- [x] Add a transparency option to the variant texture map selection. (And don't export completely transparent bones)
- [x] Locators
    - [x] Custom command keyframes.
    - [x] Locator config.
    - [x] Data Pack Compiler support.
- [x] Natively support step keyframes.
- [x] When upgrading old ajmodels, if they have command keyframes in the effect animator, create a locator at 0 0 0 with those keyframes.
- [x] Add support for Text Displays
    - [x] Basic rendering
    - [x] Word wrapping - Thanks Fetchbot!
    - [x] Italic
    - [x] Bold
    - [x] Underline
    - [x] Strikethrough
    - [x] Array style inheritance
    - [x] Support vanilla fonts
        - [x] minecraft:default
        - [x] minecraft:alt
        - [x] minecraft:illageralt
    - [x] User interface
        - [x] Figure out a nice way to configure text displays...
        - [x] Include an option to change the text.
        - [x] Include an option to change the max line width.
    - [x] Animation
        - [x] Make sure the text display is animatable.
    - [x] Add a TextDisplay config.
        - [x] Add support for billboarding to TextDisplays.
- [x] Respect inheritance in the bone config.
- [x] Change font rendering to use a geometry for each character instead of a single plane for the entire text display. This will open the possibility of loading custom fonts and spacing.
- [ ] Camera Plugin Support
    - [ ] Camera config.
    - [ ] Data Pack Compiler support.
- [ ] Change the Collection setting type to allow single-click swapping of items between lists.
- [ ] Add an about page.
    - [ ] Add an option to switch the display entity between item and block display.
    - [ ] Figure out a way to allow the user to scale the model of a bone with a display item set.
- [ ] Add Variants to the UndoSystem (Blocked by vanilla Blockbench not supporting custom undo actions)
- [x] Add a bone config option to replace the bone's display item with a custom item.
    - [ ] Add rendering for vanilla item models.
        - [ ] Parent model inheritance
        - [x] item/generated
        - [x] item/handheld
        - [x] item/handheld_rod
        - [x] item/handheld_mace
    - [ ] Add rendering for vanilla block models.
        - [ ] Parent model inheritance

# Data Pack Compiler
- [x] Merge on_tick and on_load function tags
- [x] When merging the new minecraft:tick tag with old one, try and find any old style function references (AKA animated_java:my_project/zzzzzz/tick), and remove them.
- [x] Animation Tweening
- [x] Implement animation loop mode tech.
- [x] Write files after compilaion is done by using a queue system.
- [x] Make data pack compiler as async as possible.
- [x] Actually respect variant config options.
- [x] Warn the user when a previously summoned rig needs to be re-summoned due to changes in the blueprint.
- [x] Figure out how to add repeating functionality to command keyframes.
- [x] Add toggles to command keyframes to allow continuously running the commands in the keyframe instead of only once when the keyframe is reached.
- [x] Teleport the rig to the execution location of the summon command.
- [x] Rotate the bones with the root entity.
- [x] Add default saved Locator positions to the summoned rig.
- [x] Add support for text displays.
- [ ] Figure out how cameras will work.
- [ ] Check for references to non-existant functions in merged function tags, and remove them.
- [ ] Apply variant keyframes in animations.

# Resource Pack

# Website / Documentation
- [ ] Replicate API *legacy* routes statically for backwards compatability.
- [ ] Migration guide for 0.4.8 to 1.0.0

# List of numbers to track
- [ ] Total exports
    - Stored in amount per day
- [ ] Total functions created by the data pack compiler
    - Stored in amount per day

# Github
- [ ] Reorganize the repo's branches.
    - [ ] Create a `release` branch.
    - [ ] Create a `dev` branch.
    - [x] Create a `legacy` branch.
- [ ] Reorganize the repo's tags.
    - [ ] Create a `v1.0.0` tag.
    - [ ] Create a `legacy-v0.4.8` tag.
    - [x] Create a `legacy-armorstands` tag.

# Post 1.0.0
- [ ] Add support for [block-display.com's API](https://wiki.block-display.com/api/get-api)

