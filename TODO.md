
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
- [ ] Change the Collection setting type to allow single-click swapping of items between lists.
- [ ] Add an about page.
- [ ] Respect inheritance in the bone config.
- [ ] Locator config doesn't exist yet.
- [ ] Camera Plugin Support
    - [ ] Camera config.
    - [ ] Data Pack Compiler support.
- [ ] Natively support step keyframes.
- [ ] Add a bone config option to replace the bone's display item with a custom item.
    - [ ] Will require somehow rendering the vanilla item/block model.
- [ ] Add Variants to the UndoSystem

# Data Pack Compiler
- [x] Merge on_tick and on_load function tags
- [x] When merging the new minecraft:tick tag with old one, try and find any old style function references (AKA animated_java:my_project/zzzzzz/tick), and remove them.
- [x] Animation Tweening
- [x] Implement animation loop mode tech.
- [x] Write files after compilaion is done by using a queue system.
- [x] Make data pack compiler as async as possible.
- [x] Actually respect variant config options.
- [x] Warn the user when a previously summoned rig needs to be re-summoned due to changes in the blueprint.
- [ ] Figure out how to add repeating functionality to command keyframes.
- [ ] Figure out how cameras will work.
- [ ] Add toggles to command keyframes to allow continuously running the commands in the keyframe instead of only once when the keyframe is reached.
- [ ] Rebuild main function tags based off of the AJ meta file to avoid issues with left-over function references.

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