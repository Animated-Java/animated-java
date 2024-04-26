
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
- [ ] Add a setting to automatically reduce the number of required bones, if the bones are not using special rotations, and have no unique config options.
- [ ] Change the Collection setting type to allow single-click swapping of items between lists.
- [ ] Force animations to be at least 1 tick long
- [ ] Render and handle invalid cubes with a red outline.
- [ ] Add a transparency option to the variant texture map selection.
- [ ] Add an about page.

# Data Pack Compiler
- [x] Merge on_tick and on_load function tags
- [x] When merging the new minecraft:tick tag with old one, try and find any old style function references (AKA animated_java:my_project/zzzzzz/tick), and remove them.
- [ ] Look into automatically updating "outdated" rigs when the data pack is reloaded and a new version of the rig is present. Maybe only resummon the bones of the rig, and apply summon nbt to the root?
- [ ] Implement animation loop mode tech.
- [ ] Animation Tweening
- [ ] Write files after compilaion is done by using a queue system.
- [ ] Make data pack compiler as async as possible.

# Resource Pack

# Website / Documentation
- [ ] Replicate API *legacy* routes statically for backwards compatability.

# List of numbers to track
- [ ] Total exports
    - Stored in amount per day
- [ ] Total functions created by the data pack compiler
    - Stored in amount per day

