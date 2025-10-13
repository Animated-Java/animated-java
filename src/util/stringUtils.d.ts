// This is a big mess to reduce recursion
export type SplitString<String extends string, Splitter extends string = ''> = Splitter extends ''
	? String extends `${infer C1}${infer C2}${infer C3}${infer C4}${infer C5}${infer Rest}`
		? C1 | C2 | C3 | C4 | C5 | SplitString<Rest, Splitter>
		: String extends `${infer C1}${infer C2}${infer C3}${infer C4}${infer Rest}`
		? C1 | C2 | C3 | C4 | (Rest extends '' ? never : SplitString<Rest, Splitter>)
		: String extends `${infer C1}${infer C2}${infer C3}${infer Rest}`
		? C1 | C2 | C3 | (Rest extends '' ? never : SplitString<Rest, Splitter>)
		: String extends `${infer C1}${infer C2}${infer Rest}`
		? C1 | C2 | (Rest extends '' ? never : SplitString<Rest, Splitter>)
		: String extends `${infer C1}${infer Rest}`
		? C1 | (Rest extends '' ? never : SplitString<Rest, Splitter>)
		: String
	: String extends `${infer Before}${Splitter}${infer After}`
	? Before | (After extends '' ? never : SplitString<After, Splitter>)
	: String

export type SliceString<
	String extends string,
	Slicer extends string,
	Return extends 'before' | 'after'
> = String extends `${infer Before}${Slicer}${infer After}`
	? Return extends 'before'
		? Before
		: After
	: String

export type JoinStrings<Strings extends string[]> = Strings extends []
	? ''
	: Strings extends [infer Only extends string]
	? Only
	: never

export namespace Chars {
	export type LowercaseAlpha = SplitString<'abcdefghijklmnopqrstuvwxyz'>
	export type UppercaseAlpha = SplitString<'ABCDEFGHIJKLMNOPQRSTUVWXYZ'>
	export type Number = SplitString<'0123456789'>
	export type AlphaNumeric = LowercaseAlpha | UppercaseAlpha | Number
	export type LowercaseAlphaNumeric = LowercaseAlpha | Number
	export type UppercaseAlphaNumeric = UppercaseAlpha | Number
}

export type RestrictString<String extends string, ValidChars extends string> = [
	SplitString<String>
] extends [ValidChars]
	? String
	: never
