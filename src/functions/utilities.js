import { useRef } from "react"

const availableIDs = 'abcdefghijklmnopqrstuvwxyz'

export default function assignAlphabeticalId(data) {
	const ids = 'abcdefghijklmnopqrstuvwxyz'.split('')
	let foundEmpty = false
	let cand
	while(!foundEmpty) {
		cand = ids.shift()
		if (!data.filter(n => n.id == cand).length)
			break
	}

	return cand
}

export function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
	  r: parseInt(result[1], 16),
	  g: parseInt(result[2], 16),
	  b: parseInt(result[3], 16)
	} : null;
  }