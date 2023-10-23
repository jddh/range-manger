let dragHandler, upHandler;

export default function handleClickDrag(dragFn, upFn) {
	dragHandler = dragFn
	upHandler = upFn
	window.addEventListener('mousemove', dragFn)
	window.addEventListener('mouseup', release)
}

function release(e) {
	if (upHandler) upHandler(e)
	window.removeEventListener('mousemove', dragHandler)
	window.removeEventListener('mouseup', release)
}