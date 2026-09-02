import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import {
	isFunctionTagPath,
	isJsonPath,
	isRelativePath,
	normalizePath,
	resolveEnvVariables,
	resolvePath,
	swapPathRoot,
} from '../../util/fileUtil'

describe('normalizePath', () => {
	it('converts backslashes to forward slashes', () => {
		expect(normalizePath('a\\b\\c')).toBe('a/b/c')
		expect(normalizePath('a/b/c')).toBe('a/b/c')
	})
})

describe('isJsonPath', () => {
	it('checks the .json extension', () => {
		expect(isJsonPath('pack/thing.json')).toBe(true)
		expect(isJsonPath('pack/thing.mcfunction')).toBe(false)
	})
})

describe('isFunctionTagPath', () => {
	it('is true for a json file under tags/function(s), either slash style', () => {
		expect(isFunctionTagPath('data/ns/tags/functions/foo.json')).toBe(true)
		expect(isFunctionTagPath('data/ns/tags/function/foo.json')).toBe(true)
		expect(isFunctionTagPath('data\\ns\\tags\\functions\\foo.json')).toBe(true)
	})

	it('is false for non-json or non-tag paths', () => {
		expect(isFunctionTagPath('data/ns/tags/functions/foo.mcfunction')).toBe(false)
		expect(isFunctionTagPath('data/ns/function/foo.json')).toBe(false)
		expect(isFunctionTagPath('foo.json')).toBe(false)
	})
})

describe('isRelativePath', () => {
	it('recognises ./ and ../ in both slash styles', () => {
		expect(isRelativePath('./x')).toBe(true)
		expect(isRelativePath('../x')).toBe(true)
		expect(isRelativePath('.\\x')).toBe(true)
		expect(isRelativePath('..\\x')).toBe(true)
	})

	it('is false for absolute or bare paths', () => {
		expect(isRelativePath('/abs/x')).toBe(false)
		expect(isRelativePath('x/y')).toBe(false)
	})
})

describe('resolveEnvVariables', () => {
	beforeAll(() => {
		process.env.AJ_UNIT_TEST_VAR = 'xyz'
	})
	afterAll(() => {
		delete process.env.AJ_UNIT_TEST_VAR
	})

	it('substitutes %VAR% tokens', () => {
		expect(resolveEnvVariables('a/%AJ_UNIT_TEST_VAR%/b')).toBe('a/xyz/b')
	})

	it('throws for an undefined variable', () => {
		expect(() => resolveEnvVariables('%AJ_DOES_NOT_EXIST%')).toThrow(
			'Environment variable AJ_DOES_NOT_EXIST does not exist'
		)
	})
})

describe('resolvePath', () => {
	it('expands env vars and normalises slashes for a non-relative path', () => {
		process.env.AJ_UNIT_TEST_VAR = 'xyz'
		expect(resolvePath('%AJ_UNIT_TEST_VAR%\\sub')).toBe('xyz/sub')
		delete process.env.AJ_UNIT_TEST_VAR
	})
})

describe('swapPathRoot', () => {
	it('re-roots a path under a new base', () => {
		expect(swapPathRoot('/old/root/sub/f.txt', '/old/root', '/new/base')).toBe(
			'/new/base/sub/f.txt'
		)
	})

	it('normalises slashes on all three arguments', () => {
		expect(swapPathRoot('C:\\old\\sub\\f.txt', 'C:\\old', 'D:\\new')).toBe('D:/new/sub/f.txt')
	})

	it('throws when the path is not under the old root', () => {
		expect(() => swapPathRoot('/a/b', '/c', '/d')).toThrow('does not start with')
	})
})
