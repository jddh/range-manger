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
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result ? (`${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`) : null
  }

export function hexToHSL(hex, lMod = 0) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    let r = parseInt(result[1], 16)
    let g = parseInt(result[2], 16)
    let b = parseInt(result[3], 16)

    r /= 255, g /= 255, b /= 255
    let max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max == min){
        h = s = 0 // achromatic
    } else {
        var d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6
    }

    h = Math.round(h*360)
    s = Math.round(s*100)
    l = Math.round(l*100) + lMod

    return `${h}, ${s}%, ${l}%`
}

export function arraysEqual(a,b) {
    return JSON.stringify(a) === JSON.stringify(b)
}

export function convertToBooleanVars(...variables) {
    let out = []
    variables.forEach((value, index) => {
      if (typeof value === 'boolean') {
        out[index] = value
      } else if (typeof value === 'string') {
        out[index] = value.toLowerCase() === 'true'
      } else {
        out[index] = false 
      }
    })
    return out
  }