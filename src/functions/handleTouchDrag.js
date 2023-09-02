let dragHandler;

export default function handleTouchDrag(dragFn) {
	dragHandler = dragFn;
	window.addEventListener('touchmove', dragFn)
	window.addEventListener('touchend', release)
}

function release(e) {
	window.removeEventListener('touchmove', dragHandler)
	window.removeEventListener('touchend', release)
}