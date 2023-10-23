let dragHandler, upHandler

export default function handleTouchDrag(dragFn, upFn) {
	dragHandler = dragFn
	upHandler = upFn
	window.addEventListener('touchmove', dragFn)
	window.addEventListener('touchend', release)
}

function release(e) {
	if (upHandler) upHandler(e)
	window.removeEventListener('touchmove', dragHandler)
	window.removeEventListener('touchend', release)
}