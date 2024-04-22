
# Blockbench
- [x] ~~Add a root NBT blueprint setting~~ Add a custom summon commands setting.
- [x] Custom animation properties dialog
- [x] Prevent the user setting their export namespace to 'global' or 'minecraft'
- [x] Add affected bones list to variant, and animation properties.
    - [x] Variant Properties
    - [x] Animation Properties
- [ ] Add an option to blueprint settings to export the raw .mcb file instead of the generated Data Pack.
- [ ] Implement .ajmodel to blueprint conversion.
- [ ] Add a setting to automatically reduce the number of require bones, if the bones are not using special rotations, and have no unique config options.
- [ ] Change the Collection setting type to allow single-click swapping of items between lists.

# Data Pack
- [ ] When merging the new minecraft:tick tag with old one, try and find any old style function references (AKA animated_java:my_project/zzzzzz/tick), and remove them.
- [ ] Animation Tweening
- [ ] Look into automatically updating "outdated" rigs when the data pack is reloaded and a new version of the rig is present. Maybe only resummon the bones of the rig, and apply summon nbt to the root?

# Resource Pack

