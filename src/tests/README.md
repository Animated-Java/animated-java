# Tests

Two lanes:

## Unit lane — `bun run test:unit`

Plain-Node Jest (`jest.unit.config.mjs`), no build, no Blockbench. Covers
pure-logic modules that don't touch host globals.

- `unit/easing.test.ts` — easing curve endpoints, `step`, arg parsing, `EASING_OPTIONS`
- `unit/misc.test.ts` — `roundTo`, `roundToNth`, `scrubUndefined`, `detectCircularReferences`, `mapObjEntries`
- `unit/stopwatch.test.ts` — start/stop contract, `Stopwatch.function`
- `unit/minecraftUtil.test.ts` — resource-location / data-pack / resource-pack path parsing, `toSmallCaps`, `sanitizeStorageKey`, `resolveBlockstateValueType`
- `unit/fileUtil.test.ts` — path normalisation, env-var expansion, `swapPathRoot`, tag-path detection

`unit/setup.ts` binds the `PathModule` global to `node:path`; `unit/__stubs__/`
replaces host-dependent sibling imports (fs accessor, block/registry lookups)
with no-ops so the pure functions can be imported.

## End-to-end lane — `bun run test` (or `test:only` after a build)

jestbench: loads the built plugin into a real headless Blockbench
(`jest.config.mjs` + `blockbench.config.mjs`). Needs a production build first and
`xvfb-run` on Linux. First run downloads Blockbench + Minecraft assets to
`~/.envbench`.

Some internals are exposed on the `AnimatedJava` global purely so these tests
can reach them: `renderRig`, `renderProjectAnimations`, `hashRig`,
`hashAnimations`, and the `Interaction` outliner element class.

**Outliner elements, variants & keyframes**

- `outliner-elements.test.ts` — the four types AJ registers (`text_display`, `vanilla_item_display`, `vanilla_block_display`, `interaction`): type registration, constructor defaults, property accessors, `renderRig` node mapping, codec round-trip
- `variants.test.ts` — `Variant` name uniqueness / single-default rule, `toJSON`/`fromJSON`, `TextureMap` (map / remap / prune), codec round-trip, `renderRig` variant output
- `custom-keyframes.test.ts` — the reshaped `EffectAnimator` channels, the `variant` / `function` / `execute_condition` / `repeat` keyframe accessors, animation-renderer frame output, codec round-trip

**Format & migration**

- `blueprint-codec-roundtrip.test.ts` — bones / cubes / locator / text display / variants / animations / settings survive a `compile` → `parse`
- `blueprint-fixtures-load.test.ts` — every committed sample project (`test_blueprints/`, `test_ajmodels/`, incl. a `1.4` `.ajmodel`) migrates through the DFU chain and loads
- `blueprint-texture-groups.test.ts` — regression for #407 (texture groups)
- `texture-name-sanitizer.test.ts` — regression for #337 (texture name rules)

**Export pipeline**

- `rig-renderer.test.ts` — outliner → `IRenderedRig`: node-type mapping, `includes_custom_models`, texture collection, `hashRig` change detection
- `animation-renderer.test.ts` — keyframe baking to `IRenderedAnimation`: per-tick frame count, per-node transforms, animated-channel change, `hashAnimations`
- `molang-baking.test.ts` — a Molang expression keyframe bakes identically to its literal; `animation_variable_placeholders` round-trip
- `export-pipeline.test.ts` — `exportProject` writes a real data pack + resource pack; runs across three target versions (1.20.4 / 1.21.5 / 26.2, one per `getMCBFilesByVersion` branch)
- `export-contents.test.ts` — inspects a real `player` export: `pack.mcmeta` pack_format, `summon` function body, a function per animation, scoreboard setup, block atlas, bone model JSON (geometry + textures), item model definitions, texture PNGs
- `ajmeta-incremental.test.ts` — delete a bone from an exported project, re-export, assert the stale model file + ajmeta entry are removed
- `plugin-mode-export.test.ts` — plugin-mode single-JSON export (`pluginCompiler`) shape

**Minecraft asset systems**

- `minecraft-assets.test.ts` — `assetManager` JSON/PNG lookups, `blockModelManager` / `itemModelManager` vanilla mesh builds, `getBlockState`
- `vanilla-display-rendering.test.ts` — `bmrModelRenderer` blockstate variant selection (stairs facing, slab type) and item-model predicate + display-mode resolution
- `preview-resource-pack-font.test.ts` — regression for a stale font-layout cache

**UI & mods**

- `ui-registration.test.ts` — the Blueprint format, bar actions, panels and menu bar all register; the `src/mods/` class-property patches (`Group`, `Keyframe`, `Locator`) apply; the public `AnimatedJava` API surface
- `ui-behaviour.test.ts` — firing actions does what clicking would: create-element actions add + select a node (and stay disabled off a Blueprint), the variant-panel actions create / duplicate / delete (never the default), and the About / Blueprint Settings / variant config / export-progress dialogs open and close

### Not yet covered

- deeper `datapackCompiler` output semantics (NBT of summoned entities, macro/storage animation modes, interaction/locator command wiring) — only structural checks today
- the resource-pack **font** generation path (custom fonts, glyph atlas) beyond the stale-cache regression
- multi-variant item model definitions and per-variant model overrides
- dialog _form_ round-trips (reading / writing settings through the Blueprint Settings sidebar UI) and Svelte component rendering — only open/close is checked
- `animationController` support and `src/mods/` behavioural patches (camera plugin bridge, painter, show-default-pose)
