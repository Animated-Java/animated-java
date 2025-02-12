# Blockbench

-   [ ] Change the Collection setting type to allow single-click swapping of items between lists.
-   [ ] Look into adding a color picker for tintable vanilla items.
-   [ ] Add Variants to the UndoSystem (Blocked by vanilla Blockbench not supporting custom undo actions).
-   [ ] Remove `easingArgs` and `easingMode` from saved keyframes if `easingType` is `linear`.
-   [ ] Add an option to generate a `damage_flash` variant for mob-type entities.
-   [ ] Add a fix for 360 rotation snap by using `set_frame` instead of `apply_frame` for the first frame of the animation.

# Data Pack Compiler

-   [ ] When applying variants, remove / replace any bones that have / had no elements with textured faces.
-   [ ] Add a system that detects the version of Minecraft that the data pack is being exported into. (Can probably use the level.dat of the world if it exists?)

# Resource Pack

-   [x] Warn the user when they have custom elements in their model, but have disabled the resource pack export.

# Plugin Exporter

-   [x] Add an option to export a JSON file.

# Post 1.0.0

-   [ ] Add support for [block-display.com's API](https://wiki.block-display.com/api/get-api)
-   [ ] Add support for custom fonts in TextDisplays.
-   [ ] Add support and previewing for interaction entity based locators.
-   [ ] Add support for previewing player skins on heads.
