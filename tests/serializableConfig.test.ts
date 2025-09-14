import { JsonConfig } from '@aj/util/jsonConfig'
import { describe, expect, it } from 'vitest'

@JsonConfig.decorate
export class TestConfig extends JsonConfig<TestConfig> {
	foo? = 'string'
	bar? = 42
	baz? = false
}

describe('SerializableConfig', () => {
	it('assumes default values if local values are undefined', () => {
		const config = new TestConfig()
		expect(config.foo).toBe('string')
		expect(config.bar).toBe(42)
		expect(config.baz).toBe(false)
	})

	it('allows setting local values', () => {
		const config = new TestConfig()
		config.foo = 'baz'
		config.bar = 123
		config.baz = true
		expect(config.foo).toBe('baz')
		expect(config.bar).toBe(123)
		expect(config.baz).toBe(true)
	})

	it('does not include default values when serialized unless explicitly set', () => {
		const config = new TestConfig()
		expect(config.toJSON()).toEqual({})
		config.makeDefault('foo')
		config.makeDefault('bar')
		config.makeDefault('baz')
		expect(config.toJSON()).toEqual({ foo: 'string', bar: 42, baz: false })
	})

	it('includes explicitly set values when serialized', () => {
		const config = new TestConfig()
		config.foo = 'baz'
		config.makeDefault('bar')
		expect(config.toJSON()).toEqual({ foo: 'baz', bar: 42 })
	})

	it('correctly inherits values from parent configs', () => {
		const parent = new TestConfig()
		parent.foo = 'parent'

		const child = new TestConfig()
		child.setParent(parent)
		child.setKeyInheritance('foo')

		expect(child.foo).toBe('parent')
		expect(child.toJSON()).toEqual({ __inheritedKeys__: ['foo'], foo: 'parent' })

		child.foo = 'child'
		expect(child.foo).toBe('child')
		expect(child.toJSON()).toEqual({ __inheritedKeys__: ['foo'], foo: 'child' })

		child.foo = undefined
		child.setKeyInheritance('foo', false)
		expect(child.foo).toBe('string')
		expect(child.toJSON()).toEqual({})
	})

	it('inherits values from parent configs recursively', () => {
		const grandparent = new TestConfig()
		grandparent.foo = 'grandparent'
		grandparent.bar = 69 // This should not be inherited

		const parent = new TestConfig()
		parent.setParent(grandparent)
		parent.setKeyInheritance('foo')

		const child = new TestConfig()
		child.setParent(parent)
		child.setKeyInheritance('foo')
		child.setKeyInheritance('bar')

		expect(child.foo).toBe('grandparent')
		expect(child.toJSON()).toEqual({ __inheritedKeys__: ['foo', 'bar'], foo: 'grandparent' })
		parent.foo = 'parent'
		parent.bar = 420
		expect(child.foo).toBe('parent')
		expect(child.toJSON()).toEqual({
			__inheritedKeys__: ['foo', 'bar'],
			foo: 'parent',
			bar: 420,
		})
		child.foo = 'child'
		expect(child.foo).toBe('child')
		expect(child.toJSON()).toEqual({
			__inheritedKeys__: ['foo', 'bar'],
			foo: 'child',
			bar: 420,
		})
		parent.foo = undefined
		parent.bar = undefined
		expect(child.foo).toBe('child')
		expect(child.toJSON()).toEqual({ __inheritedKeys__: ['foo', 'bar'], foo: 'child' })
	})

	it('parses JSON', () => {
		// Set values
		const config = new TestConfig().fromJSON({ foo: 'baz', bar: 123, baz: true })
		expect(config.foo).toBe('baz')
		expect(config.bar).toBe(123)
		expect(config.baz).toBe(true)
		// Clear values if not in JSON
		config.fromJSON({ foo: 'baz' })
		expect(config.foo).toBe('baz')
		expect(config.bar).toBe(42)
		expect(config.baz).toBe(false)
		// Partial JSON
		config.fromJSON({ foo: 'baz', bar: 123, baz: true }).fromJSON({}, true)
		expect(config.foo).toBe('baz')
		expect(config.bar).toBe(123)
		expect(config.baz).toBe(true)
	})

	it('parses JSON correctly with inheritance', () => {
		const parent = new TestConfig()
		parent.foo = 'parent'
		parent.bar = 69 // This should not be inherited

		const child = new TestConfig()
			.setParent(parent)
			.fromJSON({ __inheritedKeys__: ['foo'], foo: 'child' })
		expect(child.foo).toBe('child')
		expect(child.bar).toBe(42)
		expect(child.toJSON()).toEqual({ __inheritedKeys__: ['foo'], foo: 'child' })
		// Exclude metadata
		expect(child.toJSON(false)).toEqual({ foo: 'child' })
	})
})
