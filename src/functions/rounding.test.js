import { expect, test, it } from 'vitest'

const container = 1920

function getPerc(px, total, style = '') {
	let perc = px / total
	switch(style) {
		case '%':
			perc = perc * 100 + '%'
		break
		case '':
			perc = perc * 100
	}
	return perc
}

function pxToCq(px, cont = container) {
	return getPerc(px, cont) 
}

it('should transfer between px, cq and back', () => {
	const startWidth = 540
	const storage = pxToCq(startWidth)
	const endWidth = (storage/100) * container

	expect(endWidth).toBe(startWidth)
})