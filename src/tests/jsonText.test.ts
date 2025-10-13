import { COLOR_VALUES, JsonText, type TextElement } from 'src/systems/jsonText'
import { describe, expect, test } from 'vitest'
import { JsonTextParser, JsonTextSyntaxError } from '../systems/jsonText/parser'

type ErrorPattern = string | RegExp | (new (...args: any[]) => Error)
type InputOutputMap<TInput, TOutput> = Array<{ input: TInput | TInput[]; expect: TOutput }>

function text(text: TextElement) {
	return new JsonText(text)
}

function expectParsingResults(
	parser: JsonTextParser['parse'],
	map: InputOutputMap<string, TextElement>
) {
	for (const { input, expect: expectedResult } of map) {
		if (Array.isArray(input)) {
			for (const inputItem of input) {
				expect(parser(inputItem)).toEqual(text(expectedResult))
			}
		} else {
			expect(parser(input)).toEqual(text(expectedResult))
		}
	}
}

function expectErrorResults(
	parser: JsonTextParser['parse'],
	map: InputOutputMap<string, ErrorPattern>
) {
	for (const { input, expect: error } of map) {
		if (Array.isArray(input)) {
			for (const inputItem of input) {
				expect(() => parser(inputItem)).toThrowError(error)
			}
		} else {
			expect(() => parser(input)).toThrowError(error)
		}
	}
}

describe('JsonTextParser', () => {
	const modernParser = new JsonTextParser()
	const modernParse = modernParser.parse.bind(modernParser)
	const legacyParser = new JsonTextParser({ minecraftVersion: '1.20.4' })
	const legacyParse = legacyParser.parse.bind(legacyParser)

	describe('parses TextObjects', () => {
		describe('text field', () => {
			test('basic', () => {
				expectParsingResults(modernParse, [
					{
						input: [
							`{"text":"Hello, World!"}`,
							`{'text':'Hello, World!'}`,
							`{text:"Hello, World!"}`,
							` { text: "Hello, World!" } `,
							`{\n\ttext: "Hello, World!"\n}`,
						],
						expect: { text: 'Hello, World!' },
					},
				])
			})

			test('optional commas', () => {
				expectParsingResults(modernParse, [
					{
						input: [`{"text":"Hello, World!" color:red bold:true}`],
						expect: { text: 'Hello, World!', color: 'red', bold: true },
					},
				])
			})

			test('inferred', () => {
				expectParsingResults(modernParse, [
					{
						input: [
							`{"Hello, World!"}`,
							` { "Hello, World!" } `,
							`{\n\t'Hello, World!'\n}`,
						],
						expect: { text: 'Hello, World!' },
					},
				])
				expectErrorResults(modernParse, [
					{
						input: `{Hello, World}`,
						expect: /Unknown color 'World'/,
					},
					{
						input: `{color: red, Hello, World}`,
						expect: /Unknown key 'World'/,
					},
				])
			})

			test('implicit', () => {
				expect(modernParse(`{}`)).toEqual(text({ text: '' }))
			})
		})

		describe('color field', () => {
			test('named colors', () => {
				for (const color of Object.keys(COLOR_VALUES)) {
					const result = modernParse(`{color:${color}}`)
					const expected = text({ color: color as keyof typeof COLOR_VALUES, text: '' })
					expect(result).toEqual(expected)
				}
			})

			test('hex colors', () => {
				const validCases: Array<[string, TextElement]> = [
					['{color:"#00aced"}', { color: '#00aced', text: '' }],
					['{color:"#FF5555"}', { color: '#FF5555', text: '' }],
				]
				for (const [input, expected] of validCases) {
					expect(modernParse(input)).toEqual(text(expected))
				}

				expectErrorResults(modernParse, [
					{
						input: ['{color:"#FF55550"}', '{color:"#FF555"}'],
						expect: /Invalid hex color/,
					},
					{
						input: '{color:#FF5555}',
						expect: /Expected \[a\-zA\-Z0\-9_\] to start literal string/,
					},
				])
			})

			test('inferred', () => {
				expectParsingResults(modernParse, [
					{ input: '{#00aced}', expect: { color: '#00aced', text: '' } },
					{ input: '{0xFF5555}', expect: { color: '#ff5555', text: '' } },
					{
						input: '{"Hello, World!" #00aced}',
						expect: { color: '#00aced', text: 'Hello, World!' },
					},
					{
						input: '{"Hello, World!" 0xFF5555}',
						expect: { color: '#ff5555', text: 'Hello, World!' },
					},
					{
						input: '{#00aced "Hello, World!"}',
						expect: { color: '#00aced', text: 'Hello, World!' },
					},
					{
						input: '{0xFF5555 "Hello, World!"}',
						expect: { color: '#ff5555', text: 'Hello, World!' },
					},
					{
						input: '{"Hello, World!" "#00aced"}',
						expect: { color: '#00aced', text: 'Hello, World!' },
					},
					{
						input: '{"Hello, World!" red}',
						expect: { color: 'red', text: 'Hello, World!' },
					},
				])

				expectErrorResults(modernParse, [
					{
						input: [
							'{#FF55550}',
							'{#FF555}',
							'{0xFF555}',
							'{color:red, #FF5555}',
							'{color:red, 0xFF5555}',
							'{"#FF5555", "Hello, World!"}',
							'{red, "Hello, World!"}',
						],
						expect: JsonTextSyntaxError,
					},
				])
			})
		})

		test('shadow_color field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{shadow_color:"#ff00aced"}`,
					expect: { shadow_color: JsonText.hexToRgba('#ff00aced'), text: '' },
				},
				{
					input: `{shadow_color:0xff00aced}`,
					expect: { shadow_color: JsonText.hexToRgba('#ff00aced'), text: '' },
				},
				{
					input: `{shadow_color:[${JsonText.hexToRgba('#ff00aced')}]}`,
					expect: { shadow_color: JsonText.hexToRgba('#ff00aced'), text: '' },
				},
				{
					input: `{shadow_color:${JsonText.hexToInt('#ff00aced')}}`,
					expect: { shadow_color: JsonText.hexToRgba('#ff00aced'), text: '' },
				},
			])
		})

		test('boolean style fields', () => {
			const fields = ['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated'] as const

			const cases = [
				{ value: true, variants: ['true', 'TRUE'] },
				{ value: false, variants: ['false', 'FALSE'] },
			]

			for (const field of fields) {
				for (const { value, variants } of cases) {
					for (const variant of variants) {
						const input = `{${field}:${variant}}`
						const expected = text({ [field]: value, text: '' })
						expect(modernParse(input)).toEqual(expected)
					}
				}
			}

			// Test invalid values
			expectErrorResults(modernParse, [
				{
					input: [
						'{bold:yes}',
						'{italic:no}',
						'{underlined:1}',
						'{strikethrough:0}',
						'{obfuscated:null}',
						'{bold:"true"}',
					],
					expect: JsonTextSyntaxError,
				},
			])
		})

		test('font field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{font:"minecraft:illager"}`,
					expect: { font: 'minecraft:illager', text: '' },
				},
			])
		})

		test('keybind field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{keybind:"key.jump"}`,
					expect: { keybind: 'key.jump' },
				},
			])
		})

		test('extra field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{extra:["some_extra_text", {"and a text object"}]}`,
					expect: { extra: ['some_extra_text', { text: 'and a text object' }], text: '' },
				},
				{
					input: `{extra:[{extra:["some_extra_text", {"and a text object"}]}]}`,
					expect: {
						extra: [
							{ extra: ['some_extra_text', { text: 'and a text object' }], text: '' },
						],
						text: '',
					},
				},
			])
			expectErrorResults(modernParse, [
				{
					input: `{extra:"not-an-array"}`,
					expect: /Expected '\[' to begin TextElementArray/,
				},
			])
		})

		test('insertion field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{insertion:'some_text'}`,
					expect: { insertion: 'some_text', text: '' },
				},
			])
		})

		test('translate field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{translate:'my.translation.key'}`,
					expect: { translate: 'my.translation.key' },
				},
				{
					input: [
						`{translate:'my.translation.key', with:['arg1','arg2']}`,
						`{'my.translation.key', with:['arg1','arg2']}`,
					],
					expect: { translate: 'my.translation.key', with: ['arg1', 'arg2'] },
				},
				{
					input: [
						`{translate:'my.translation.key', fallback:'fallback text'}`,
						`{'my.translation.key', fallback:'fallback text'}`,
					],
					expect: { translate: 'my.translation.key', fallback: 'fallback text' },
				},
			])
			expectErrorResults(modernParse, [
				{
					input: `{with:['arg1','arg2']}`,
					expect: /'with' requires 'translate'/,
				},
				{
					input: `{fallback:'fallback text'}`,
					expect: /'fallback' requires 'translate'/,
				},
			])
		})

		test('score field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{score:{name:'Player',objective:'obj1'}}`,
					expect: { score: { name: 'Player', objective: 'obj1' } },
				},
			])
		})

		test('selector field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{selector:'@e'}`,
					expect: { selector: '@e' },
				},
				{
					input: `{selector:'@e',separator:{', '}}`,
					expect: { selector: '@e', separator: { text: ', ' } },
				},
				{
					input: `{selector:'@e',separator:', '}`,
					expect: { selector: '@e', separator: ', ' },
				},
			])
		})

		test('nbt field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{nbt:'Items[]',block:'0 0 0', interpret:true,separator:', '}`,
					expect: { nbt: 'Items[]', block: '0 0 0', interpret: true, separator: ', ' },
				},
				{
					input: `{nbt:'SelectedItem',entity:'@s', interpret:false,separator:', '}`,
					expect: {
						nbt: 'SelectedItem',
						entity: '@s',
						interpret: false,
						separator: ', ',
					},
				},
				{
					input: `{nbt:'temp[{id:2}]',storage:'animated_java:test'}`,
					expect: { nbt: 'temp[{id:2}]', storage: 'animated_java:test' },
				},
			])
			expectErrorResults(modernParse, [
				{
					input: `{nbt:'Items[]'}`,
					expect: /'nbt' requires 'block', 'entity', or 'storage'/,
				},
				{
					input: `{block:'~ ~ ~'}`,
					expect: /'block' requires 'nbt'/,
				},
				{
					input: `{entity:'@s'}`,
					expect: /'entity' requires 'nbt'/,
				},
				{
					input: `{storage:'animated_java:test'}`,
					expect: /'storage' requires 'nbt'/,
				},
			])
		})

		test('separator field', () => {
			expectErrorResults(modernParse, [
				{
					input: `{separator:', '}`,
					expect: /'separator' requires 'nbt' or 'selector'/,
				},
			])
		})

		test('object field', () => {
			expectErrorResults(modernParse, [
				{
					input: `{object:'atlas'}`,
					expect: /atlas object requires 'sprite'/,
				},
				{
					input: `{object:'player'}`,
					expect: /player object requires 'player'/,
				},
			])
		})

		test('sprite field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{sprite:'minecraft:stone'}`,
					expect: { sprite: 'minecraft:stone' },
				},
				{
					input: `{sprite:'minecraft:diamond'}`,
					expect: { sprite: 'minecraft:diamond' },
				},
			])
		})

		test('atlas object field', () => {
			expectErrorResults(modernParse, [
				{
					input: `{atlas:'minecraft:items'}`,
					expect: /'atlas' requires 'sprite'/,
				},
			])
		})

		test('player object field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{player:{}}`,
					expect: { player: {} as any },
				},
				{
					input: `{player:{name:'SnaveSutit',id:'0-0-0-0-0',texture:'some:texture/path',cape:'some:cape/path',model:'wide',hat:true}}`,
					expect: {
						player: {
							name: 'SnaveSutit',
							id: '0-0-0-0-0',
							texture: 'some:texture/path',
							cape: 'some:cape/path',
							model: 'wide',
							hat: true,
							properties: undefined,
						},
					},
				},
				{
					input: `{player:{name:'SnaveSutit',properties:[{name:'textures',value:'some_base64_value',signature:'some_base64_signature'}]}}`,
					expect: {
						player: {
							name: 'SnaveSutit',
							properties: [
								{
									name: 'textures',
									value: 'some_base64_value',
									signature: 'some_base64_signature',
								},
							],
						},
					},
				},
			])
		})

		test('legacy clickEvent field', () => {
			expectParsingResults(legacyParse, [
				{
					input: `{clickEvent:{action:'open_url',value:'https://example.com'}}`,
					expect: {
						clickEvent: { action: 'open_url', value: 'https://example.com' },
						text: '',
					},
				},
				{
					input: `{clickEvent:{action:'run_command',value:'say hi'}}`,
					expect: {
						clickEvent: { action: 'run_command', value: 'say hi' },
						text: '',
					},
				},
				{
					input: `{clickEvent:{action:'suggest_command',value:'say hi'}}`,
					expect: {
						clickEvent: { action: 'suggest_command', value: 'say hi' },
						text: '',
					},
				},
				{
					input: `{clickEvent:{action:'change_page',value:'5'}}`,
					expect: {
						clickEvent: { action: 'change_page', value: '5' },
						text: '',
					},
				},
				{
					input: `{clickEvent:{action:'copy_to_clipboard',value:'Hello, Clipboardy World!'}}`,
					expect: {
						clickEvent: {
							action: 'copy_to_clipboard',
							value: 'Hello, Clipboardy World!',
						},
						text: '',
					},
				},
				{
					input: `{clickEvent:{action:'copy_to_clipboard',value:'Hello, Clipboardy World!'}}`,
					expect: {
						clickEvent: {
							action: 'copy_to_clipboard',
							value: 'Hello, Clipboardy World!',
						},
						text: '',
					},
				},
			])
			expectErrorResults(legacyParse, [
				{
					input: [
						// Cannot use `open_file` in legacy clickEvent
						`{clickEvent:{action:'open_file',value:'file:///example/path'}}`,
						// Unknown action
						`{clickEvent:{action:'unknown_action',value:'test'}}`,
						// Missing value
						`{clickEvent:{action:'open_url'}}`,
						// Missing action
						`{clickEvent:{value:'test'}}`,
						// Non-object clickEvent
						`{clickEvent:'not-an-object'}`,
					],
					expect: JsonTextSyntaxError,
				},
			])
		})

		test('modern click_event field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{click_event:{action:'open_url',url:'https://example.com'}}`,
					expect: {
						click_event: { action: 'open_url', url: 'https://example.com' },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'run_command',command:'say hi'}}`,
					expect: {
						click_event: { action: 'run_command', command: 'say hi' },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'suggest_command',command:'say hi'}}`,
					expect: {
						click_event: { action: 'suggest_command', command: 'say hi' },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'run_command',command:'say hi'}}`,
					expect: {
						click_event: { action: 'run_command', command: 'say hi' },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'suggest_command',command:'say hi'}}`,
					expect: {
						click_event: { action: 'suggest_command', command: 'say hi' },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'suggest_command',command:'say hi'}}`,
					expect: {
						click_event: { action: 'suggest_command', command: 'say hi' },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'change_page',page:5}}`,
					expect: {
						click_event: { action: 'change_page', page: 5 },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'copy_to_clipboard',value:'Hello, Clipboardy World!'}}`,
					expect: {
						click_event: {
							action: 'copy_to_clipboard',
							value: 'Hello, Clipboardy World!',
						},
						text: '',
					},
				},
				{
					input: `{click_event:{action:'copy_to_clipboard',value:'Hello, Clipboardy World!'}}`,
					expect: {
						click_event: {
							action: 'copy_to_clipboard',
							value: 'Hello, Clipboardy World!',
						},
						text: '',
					},
				},
				{
					input: `{click_event:{action:'show_dialog',dialog:{type:'minecraft:notice',title:'test',body:[{type:'plain_message',contents:{text:'test'}}]}}}`,
					expect: {
						click_event: {
							action: 'show_dialog',
							dialog: {
								type: 'minecraft:notice',
								title: 'test',
								body: [{ type: 'plain_message', contents: { text: 'test' } }],
							},
						},
						text: '',
					},
				},
				{
					input: `{click_event:{action:'custom',id:'my_custom_action'}}`,
					expect: {
						click_event: { action: 'custom', id: 'my_custom_action' },
						text: '',
					},
				},
				{
					input: `{click_event:{action:'custom',id:'my_custom_action',payload:{some:'data'}}}`,
					expect: {
						click_event: {
							action: 'custom',
							id: 'my_custom_action',
							payload: { some: 'data' },
						},
						text: '',
					},
				},
			])
			expectErrorResults(modernParse, [
				{
					input: [
						// Cannot use `open_file` in commands
						`{click_event:{action:'open_file',path:'file:///example/path'}}`,
						// Unknown action
						`{click_event:{action:'unknown_action',foo:'bar'}}`,
						// Missing required field for open_url
						`{click_event:{action:'open_url'}}`,
						// Missing required field for run_command
						`{click_event:{action:'run_command'}}`,
						// Missing required field for suggest_command
						`{click_event:{action:'suggest_command'}}`,
						// Missing required field for change_page
						`{click_event:{action:'change_page'}}`,
						// Missing required field for copy_to_clipboard
						`{click_event:{action:'copy_to_clipboard'}}`,
						// Non-object click_event
						`{click_event:'not-an-object'}`,
						// Invalid dialog structure
						`{click_event:{action:'show_dialog',dialog:'not-an-object'}}`,
						// Custom action missing id
						`{click_event:{action:'custom'}}`,
					],
					expect: JsonTextSyntaxError,
				},
			])
		})

		test('legacy hoverEvent field', () => {
			expectParsingResults(legacyParse, [
				{
					input: `{hoverEvent:{action:'show_text',contents:'Hello!'}}`,
					expect: {
						hoverEvent: { action: 'show_text', contents: 'Hello!' },
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_text',contents:{text:'Hello!'}}}`,
					expect: {
						hoverEvent: { action: 'show_text', contents: { text: 'Hello!' } },
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_item',contents:{id:'minecraft:stone',count:1}}}`,
					expect: {
						hoverEvent: {
							action: 'show_item',
							contents: { id: 'minecraft:stone', count: 1 },
						},
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_item',contents:{id:'minecraft:stone',count:1,tag:{some:'data'}}}}`,
					expect: {
						hoverEvent: {
							action: 'show_item',
							contents: { id: 'minecraft:stone', count: 1, tag: { some: 'data' } },
						},
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_entity',contents:{type:'minecraft:player',id:'0-0-0-0-0',name:'Player'}}}`,
					expect: {
						hoverEvent: {
							action: 'show_entity',
							contents: {
								type: 'minecraft:player',
								id: '0-0-0-0-0',
								name: 'Player',
							},
						},
						text: '',
					},
				},
				{
					input: [
						`{hoverEvent:{action:'show_entity',contents:{type:'minecraft:player',id:[0,0,0,0],name:'Player'}}}`,
						`{hoverEvent:{action:'show_entity',contents:{type:'minecraft:player',id:[I;0,0,0,0],name:'Player'}}}`,
					],
					expect: {
						hoverEvent: {
							action: 'show_entity',
							contents: {
								type: 'minecraft:player',
								id: [0, 0, 0, 0],
								name: 'Player',
							},
						},
						text: '',
					},
				},
				// Transforms modern hover_event into legacy hoverEvent
				{
					input: `{hover_event:{action:'show_text',value:'Hello!'}}`,
					expect: {
						hoverEvent: { action: 'show_text', contents: 'Hello!' },
						text: '',
					},
				},
				{
					input: `{hover_event:{action:'show_text',value:{text:'Hello!'}}}`,
					expect: {
						hoverEvent: { action: 'show_text', contents: { text: 'Hello!' } },
						text: '',
					},
				},
				{
					input: `{hover_event:{action:'show_item',id:'minecraft:stone',count:1}}`,
					expect: {
						hoverEvent: {
							action: 'show_item',
							contents: {
								id: 'minecraft:stone',
								count: 1,
							},
						},
						text: '',
					},
				},
				{
					input: `{hover_event:{action:'show_entity',id:'minecraft:player',uuid:'0-0-0-0-0',name:'Player'}}`,
					expect: {
						hoverEvent: {
							action: 'show_entity',
							contents: {
								type: 'minecraft:player',
								id: '0-0-0-0-0',
								name: 'Player',
							},
						},
						text: '',
					},
				},
			])
			expectErrorResults(legacyParse, [
				{
					input: [
						// Unknown action
						`{hoverEvent:{action:'unknown_action',value:'test'}}`,
						// Missing value for show_text
						`{hoverEvent:{action:'show_text'}}`,
						// Missing id for show_item
						`{hoverEvent:{action:'show_item',count:1}}`,
						// Missing type for show_entity
						`{hoverEvent:{action:'show_entity',id:'1234',name:'Player'}}`,
						// Non-object hoverEvent
						`{hoverEvent:'not-an-object'}`,
					],
					expect: JsonTextSyntaxError,
				},
				{
					input: `{hover_event:{action:'show_item',id:'minecraft:stone',count:1,components:{'minecraft:custom_data':{some:'data'}}}}`,
					expect: /Cannot transform 'hover_event' with 'components' into legacy 'hoverEvent'/,
				},
				{
					input: [
						`{hover_event:{action:'show_entity',id:'minecraft:player',uuid:[0,0,0,0],name:'Player'}}`,
						`{hover_event:{action:'show_entity',id:'minecraft:player',uuid:[I;0,0,0,0],name:'Player'}}`,
					],
					expect: /Cannot transform 'hover_event' with 'uuid' as int-array into legacy 'hoverEvent'/,
				},
			])
		})

		test('modern hover_event field', () => {
			expectParsingResults(modernParse, [
				{
					input: `{hover_event:{action:'show_text',value:'Hello!'}}`,
					expect: {
						hover_event: { action: 'show_text', value: 'Hello!' },
						text: '',
					},
				},
				{
					input: `{hover_event:{action:'show_text',value:{text:'Hello!'}}}`,
					expect: {
						hover_event: { action: 'show_text', value: { text: 'Hello!' } },
						text: '',
					},
				},
				{
					input: `{hover_event:{action:'show_item',id:'minecraft:stone',count:1}}`,
					expect: {
						hover_event: {
							action: 'show_item',
							id: 'minecraft:stone',
							count: 1,
						},
						text: '',
					},
				},
				{
					input: `{hover_event:{action:'show_item',id:'minecraft:stone',count:1,components:{'minecraft:custom_data':{some:'data'}}}}`,
					expect: {
						hover_event: {
							action: 'show_item',
							id: 'minecraft:stone',
							count: 1,
							components: { 'minecraft:custom_data': { some: 'data' } },
						},
						text: '',
					},
				},
				{
					input: `{hover_event:{action:'show_entity',id:'minecraft:player',uuid:'0-0-0-0-0',name:'Player'}}`,
					expect: {
						hover_event: {
							action: 'show_entity',
							id: 'minecraft:player',
							uuid: '0-0-0-0-0',
							name: 'Player',
						},
						text: '',
					},
				},
				{
					input: [
						`{hover_event:{action:'show_entity',id:'minecraft:player',uuid:[0,0,0,0],name:'Player'}}`,
						`{hover_event:{action:'show_entity',id:'minecraft:player',uuid:[I;0,0,0,0],name:'Player'}}`,
					],
					expect: {
						hover_event: {
							action: 'show_entity',
							id: 'minecraft:player',
							uuid: [0, 0, 0, 0],
							name: 'Player',
						},
						text: '',
					},
				},
				// Transforms legacy hoverEvent into modern hover_event
				{
					input: `{hoverEvent:{action:'show_text',contents:'Hello!'}}`,
					expect: {
						hover_event: { action: 'show_text', value: 'Hello!' },
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_text',contents:{text:'Hello!'}}}`,
					expect: {
						hover_event: { action: 'show_text', value: { text: 'Hello!' } },
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_item',contents:{id:'minecraft:stone',count:1}}}`,
					expect: {
						hover_event: {
							action: 'show_item',
							id: 'minecraft:stone',
							count: 1,
						},
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_item',contents:{id:'minecraft:stone',count:1}}}`,
					expect: {
						hover_event: {
							action: 'show_item',
							id: 'minecraft:stone',
							count: 1,
						},
						text: '',
					},
				},
				{
					input: `{hoverEvent:{action:'show_entity',contents:{type:'minecraft:player',id:'0-0-0-0-0',name:'Player'}}}`,
					expect: {
						hover_event: {
							action: 'show_entity',
							id: 'minecraft:player',
							uuid: '0-0-0-0-0',
							name: 'Player',
						},
						text: '',
					},
				},
				{
					input: [
						`{hoverEvent:{action:'show_entity',contents:{type:'minecraft:player',id:[0,0,0,0],name:'Player'}}}`,
						`{hoverEvent:{action:'show_entity',contents:{type:'minecraft:player',id:[I;0,0,0,0],name:'Player'}}}`,
					],
					expect: {
						hover_event: {
							action: 'show_entity',
							id: 'minecraft:player',
							uuid: [0, 0, 0, 0],
							name: 'Player',
						},
						text: '',
					},
				},
			])
			expectErrorResults(modernParse, [
				{
					input: [
						// Unknown action
						`{hover_event:{action:'unknown_action',value:'test'}}`,
						// Missing value for show_text
						`{hover_event:{action:'show_text'}}`,
						// Missing id for show_item
						`{hover_event:{action:'show_item',count:1}}`,
						// Missing id for show_entity
						`{hover_event:{action:'show_entity',uuid:'0-0-0-0-0',name:'Player'}}`,
						// Non-object hover_event
						`{hover_event:'not-an-object'}`,
					],
					expect: JsonTextSyntaxError,
				},
				{
					input: `{hoverEvent:{action:'show_item',contents:{id:'minecraft:stone',count:1,tag:{some:'data'}}}}`,
					expect: /Cannot transform 'hoverEvent' with 'tag' into modern 'hover_event'/,
				},
			])
		})
	})

	test('parses TextElement arrays', () => {
		expectParsingResults(modernParse, [
			// Simple object arrays
			{
				input: [
					'[{"text":"Hello, "},{"text":"World!"}]',
					'[{text:"Hello, "},{text:"World!"}]',
					' [ { text: "Hello, " }, { text: "World!" } ] ',
					`[\n\t{\n\t\ttext: "Hello, "\n\t},\n\t{\n\t\ttext: "World!"\n\t}\n]`,
					'[{"Hello, "},{"World!"}]',
				],
				expect: [{ text: 'Hello, ' }, { text: 'World!' }],
			},
			// Simple string arrays
			{
				input: [
					'["Hello, ", "World!"]',
					'["Hello, " "World!"]',
					' [ "Hello, " "World!" ] ',
					`[\n\t"Hello, "\n\t,\n\t"World!"\n]`,
				],
				expect: ['Hello, ', 'World!'],
			},
			// Nested string arrays
			{
				input: [
					'["Hello, ", ["Recursive"], "World!"]',
					'["Hello, " ["Recursive"] "World!"]',
					' [ "Hello, " ["Recursive"] "World!" ] ',
					`[\n\t"Hello, "\n\t,\n\t["Recursive"]\n\t,\n\t"World!"\n]`,
				],
				expect: ['Hello, ', ['Recursive'], 'World!'],
			},
			// Nested object arrays
			{
				input: [
					'[{"text":"Hello, "}, [{"text":"Recursive"}], {"text":"World!"}]',
					'[{text:"Hello, "}, [{text:"Recursive"}], {text:"World!"}]',
					' [ { text: "Hello, " }, [ { text: "Recursive" } ], { text: "World!" } ] ',
					`[\n\t{\n\t\ttext: "Hello, "\n\t},\n\t[\n\t\t{\n\t\t\ttext: "Recursive"\n\t\t}\n\t],\n\t{\n\t\ttext: "World!"\n\t}\n]`,
				],
				expect: [{ text: 'Hello, ' }, [{ text: 'Recursive' }], { text: 'World!' }],
			},
			// Additional edge cases
			{ input: [`[]`], expect: [] },
			{ input: [`[{}]`], expect: [{ text: '' }] },
			{ input: [`[{"text":""}]`], expect: [{ text: '' }] },
		])
	})
})
