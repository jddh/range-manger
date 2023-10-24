/**
 * given background elements and foreground elements, calculate max left and right travel
 * @param {array} inactiveElements 
 * @param {array, HTMLElement} activeElements 
 * @param {HTMLElement} container 
 * @returns {object} {left,right}
 */
export function createBounds(inactiveElements, activeElements, container) {
	let boundsRect
	const boundsOverlap = 10	//safety if active elements overlap

	const player = activeElements.length ? createAggregateDimensions(activeElements): getRect(activeElements)
	const containerRect = getRect(container)

	let lefts = inactiveElements.map(n => n.getBoundingClientRect().right)
	lefts.push(containerRect.left)
	lefts = lefts.filter(e => e <= player.left + boundsOverlap)

	let rights = inactiveElements.map(n => n.getBoundingClientRect().left)
	rights.push(containerRect.right)
	rights = rights.filter(e => e >= player.right - boundsOverlap)

	boundsRect = {left: lefts.sort(sortAsc)[lefts.length-1], right: rights.sort(sortAsc)[0]}

	return boundsRect
}

export function createAggregateDimensions(elements) {
	let playerRect

	let lefts = elements.map(n => getRect(n).left)
	let rights = elements.map(n => getRect(n).right)

	playerRect = {left: lefts.sort(sortAsc)[0], right: rights.sort(sortAsc)[rights.length-1]}

	return playerRect
}

const sortAsc = (a,b) => a-b

export function getRect(el) {
	return el.getBoundingClientRect()
}

export function gridSnap(x) {
	return Math.round(x)
}