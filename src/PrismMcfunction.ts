window.Prism.languages.mcfunction = {
	comment: /^#.*$/im,
	selector: {
		pattern: /@(s|e|a|p|r)(\[(.*?)\])?/,
		inside: {
			selector: /@(s|e|a|p|r)/,
			number: undefined,
			operator: /\=/,
			punctuation: undefined,
			property: /\w+/,
		},
	},
	'exeucte-subcommands': {
		pattern:
			/\b(align|anchored|as|at|facing|in|on|positioned|rotated|store|summon|if|unless|run)\b/,
		alias: 'keyword',
	},
	'command-name': {
		pattern: /(^|\brun )\w+/m,
		alias: 'function',
		lookbehind: true,
	},
	punctuation: /\.|,/,
	number: {
		pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
	},
}
// @ts-ignore
window.Prism.languages.mcfunction.selector.inside.number = window.Prism.languages.mcfunction.number
// @ts-ignore
window.Prism.languages.mcfunction.selector.inside.punctuation =
	window.Prism.languages.mcfunction.punctuation

const code = `execute align xyz
execute anchored feet
execute as @s
# execute as :,$#@/\\\\=*<>%+~^awd!()*@!@!@@#$%^&*([]]}|\\\<>/,.+=-\`~▬♂,7Xƒ*+8M╕7
execute at @s
execute facing entity @s feet
execute facing 0 ~.0 0.2
execute if block ~ ~ ~ minecraft:stone
execute if block ~ ~ ~ #minecraft:grass_block[]
execute if block ~ ~ ~ minecraft:stone_slab[waterlogged=false, shape=top, foo=22]
execute if blocks ~-1 ~ ~-1 ~1 ~ ~1 ~ ~ ~ all
execute if blocks ~-1 ~ ~-1 ~1 ~ ~1 ~ ~ ~ masked
# Testing NBT path parsing
execute if data block 0 1 0 test.path.A
execute if data block 0 1 0 test.path.A{}
execute if data block 0 1 0 test.path.A[]
execute if data block 0 1 0 Items[0].tag.BlockEntityTag.Items[2].tag.ench[0].lvl
execute if data block 0 1 0 this.path{max_closed_nodes:1000}.start
execute if data block 0 1 0 ArmorItems[-1].tag."my Special Tag"
execute if data block 0 1 0 Items[{Slot:12b}].tag.list
execute if data block 0 1 0 Items[{ Slot : 12b }].tag.list
execute if data block 0 0 0 {foo: {bar: false}, baz: [I;1, 20, 3]}
execute if data entity @s {foo: {bar: false}, baz: [I;1, 20, 3]}
execute if data storage foo:bar test.path.A
execute if data storage foo:bar {foo: {bar: false}, baz: [I;1, 20, 3]}
execute if dimension minecraft:overworld
execute if dimension the_nether
execute if dimension foo:my_dimension
execute if entity @s
execute if loaded 0 0 0
execute if predicate namespace:my_predicate
execute if score .a i < .b i
execute if score .a i <= .b i
execute if score .a i = .b i
execute if score .a i > .b i
execute if score .a i >= .b i
execute if score .a i matches 0..2
execute in minecraft:overworld
execute positioned as @s
execute positioned 0 0 0
execute rotated as @s
execute rotated ~ 0
execute run execute run execute run execute run execute run execute run execute run execute run execute run execute run execute run execute as @s
execute store result block 0 1 0 test.path.A byte 1.0
execute store result block 0 1 0 test.path.A double 1.0
execute store result block 0 1 0 test.path.A float 1.0
execute store result block 0 1 0 test.path.A int 1.0
execute store result block 0 1 0 test.path.A long 1.0
execute store result block 0 1 0 test.path.A short 1.0
execute store result bossbar ex:bossbar max
execute store result bossbar ex:bossbar value
execute store result entity @s test.path.A byte 1.0
execute store result entity @s test.path.A double 1.0
execute store result entity @s test.path.A float 1.0
execute store result entity @s test.path.A int 1.0
execute store result entity @s test.path.A long 1.0
execute store result entity @s test.path.A short 1.0
execute store result score .c v
execute store result storage foo:bar test.path.A byte 1.0
execute store result storage foo:bar test.path.A double 1.0
execute store result storage foo:bar test.path.A float 1.0
execute store result storage foo:bar test.path.A int 1.0
execute store result storage foo:bar test.path.A long 1.0
execute store result storage foo:bar test.path.A short 1.0
execute store success block 0 1 0 test.path.A byte 1.0
execute store success block 0 1 0 test.path.A double 1.0
execute store success block 0 1 0 test.path.A float 1.0
execute store success block 0 1 0 test.path.A int 1.0
execute store success block 0 1 0 test.path.A long 1.0
execute store success block 0 1 0 test.path.A short 1.0
execute store success bossbar ex:bossbar max
execute store success bossbar ex:bossbar value
execute store success entity @s test.path.A byte 1.0
execute store success entity @s test.path.A double 1.0
execute store success entity @s test.path.A float 1.0
execute store success entity @s test.path.A int 1.0
execute store success entity @s test.path.A long 1.0
execute store success entity @s test.path.A short 1.0
execute store success score .c v
execute store success storage foo:bar test.path.A byte 1.0
execute store success storage foo:bar test.path.A double 1.0
execute store success storage foo:bar test.path.A float 1.0
execute store success storage foo:bar test.path.A int 1.0
execute store success storage foo:bar test.path.A long 1.0
execute store success storage foo:bar test.path.A short 1.0
execute unless block ~ ~ ~ minecraft:stone
execute unless blocks ~-1 ~ ~-1 ~1 ~ ~1 ~ ~ ~ all
execute unless blocks ~-1 ~ ~-1 ~1 ~ ~1 ~ ~ ~ masked
execute unless data block 0 0 0 test.path.A
execute unless data entity @s test.path.A
execute unless data storage foo:bar test.path.A
execute unless entity @s
execute unless predicate namespace:my_predicate
execute unless score .a i < .b i
execute unless score .a i <= .b i
execute unless score .a i = .b i
execute unless score .a i > .b i
execute unless score .a i >= .b i
execute unless score .a i matches 0..2
`

// setTimeout(() => {
// 	new AJDialog(
// 		TestEditor,
// 		{
// 			language: 'mcfunction',
// 			code,
// 		},
// 		{
// 			id: 'aj_prism_editor',
// 			title: 'Prism Editor',
// 			width: 1200,
// 		}
// 	).show()
// }, 250)
