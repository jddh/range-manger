import { expect, test, it } from 'vitest'
import * as utilities from './utilities'

it('should convert hex to rgb', () => {
	const col = '#96D3FF'
	const conv = utilities.hexToRgb(col)
	expect(conv).toStrictEqual('150, 211, 255')
})