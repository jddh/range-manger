let dragHandler;

export default function handleClickDrag(dragFn) {
	dragHandler = dragFn;
	window.addEventListener('mousemove', dragFn)
	window.addEventListener('mouseup', release)
}

function release(e) {
	window.removeEventListener('mousemove', dragHandler)
	window.removeEventListener('mouseup', release)
}