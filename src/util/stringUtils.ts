export type SplitString<
	String extends string,
	Splitter extends string = '',
> = String extends `${infer Char}${Splitter}${infer Rest}`
	? Char | SplitString<Rest, Splitter>
	: String

export type SliceString<
	String extends string,
	Slicer extends string,
	Return extends 'before' | 'after',
> = String extends `${infer Before}${Slicer}${infer After}`
	? Return extends 'before'
		? Before
		: After
	: String

export namespace Chars {
	export type LowercaseAlpha = SplitString<'abcdefghijklmnopqrstuvwxyz'>
	export type UppercaseAlpha = SplitString<'ABCDEFGHIJKLMNOPQRSTUVWXYZ'>
	export type Number = SplitString<'0123456789'>
	export type AlphaNumeric = LowercaseAlpha | UppercaseAlpha | Number
	export type LowercaseAlphaNumeric = LowercaseAlpha | Number
	export type UppercaseAlphaNumeric = UppercaseAlpha | Number
}

export type RestrictString<
	String extends string,
	ValidChars extends string,
	AllowEmpty extends boolean = false,
> = String extends ''
	? AllowEmpty extends true
		? ''
		: `String must not be empty`
	: String extends `${infer This}${infer Rest}`
		? This extends ValidChars
			? `${This}${RestrictString<Rest, ValidChars, true>}`
			: `${This} <- invalid character '${This}'`
		: 'String must not be empty'
