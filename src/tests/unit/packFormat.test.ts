import { describe, expect, it } from '@jest/globals'
import { LAST_LEGACY_PACK_FORMAT, setPackFormat } from '../../util/packFormat'

const STALE = {
	description: 'My pack',
	pack_format: 48,
	supported_formats: [48, 61],
	min_format: 88,
	max_format: [94, 1],
}

describe('setPackFormat', () => {
	it('declares legacy formats with pack_format and supported_formats', () => {
		const pack = { ...STALE }
		setPackFormat(pack, 81, LAST_LEGACY_PACK_FORMAT.data_pack)
		expect(pack).toEqual({
			description: 'My pack',
			pack_format: 81,
			supported_formats: { min_inclusive: 81, max_inclusive: 81 },
		})
	})

	it('declares newer formats with only min_format and max_format', () => {
		const pack = { ...STALE }
		setPackFormat(pack, 69, LAST_LEGACY_PACK_FORMAT.resource_pack)
		expect(pack).toEqual({ description: 'My pack', min_format: 69, max_format: 69 })
	})

	it('splits at the last legacy format of each pack type', () => {
		const resourcePack = {}
		setPackFormat(resourcePack, 64, LAST_LEGACY_PACK_FORMAT.resource_pack)
		expect(resourcePack).toHaveProperty('pack_format', 64)

		const dataPack = {}
		setPackFormat(dataPack, 82, LAST_LEGACY_PACK_FORMAT.data_pack)
		expect(dataPack).toEqual({ min_format: 82, max_format: 82 })
	})
})
