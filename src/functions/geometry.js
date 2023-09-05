/**
 * 
 * @param {array} inactiveElements 
 * @param {array, HTMLElement} activeElements 
 * @param {HTMLElement} container 
 * @returns {object} {left,right}
 */
export function createBounds(inactiveElements, activeElements, container) {
	let boundsRect
	const player = activeElements.length ? createPlayer(activeElements): getRect(activeElements)
	const containerRect = getRect(container)

	let lefts = inactiveElements.map(n => n.getBoundingClientRect().right)
	lefts.push(containerRect.left)
	lefts = lefts.filter(e => e < player.left)

	let rights = inactiveElements.map(n => n.getBoundingClientRect().left)
	rights.push(containerRect.right)
	rights = rights.filter(e => e > player.right)

	boundsRect = {left: lefts.sort(sortAsc)[lefts.length-1], right: rights.sort(sortAsc)[0]}

	return boundsRect
}

function createPlayer(elements) {
	let playerRect

	let lefts = elements.map(n => n.getBoundingClientRect().left)
	let rights = elements.map(n => n.getBoundingClientRect().right)

	playerRect = {left: lefts.sort(sortAsc)[lefts.length-1], right: rights.sort(sortAsc)[rights.length-1]}

	return playerRect
}

const sortAsc = (a,b) => a-b

export function getRect(el) {
	return el.getBoundingClientRect()
}