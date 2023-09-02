import {useRef} from 'react'
import ResizeHandle from './ResizeHandle'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'

export default function Nap({className, x , size, containerRect, getContainerRect, mover, sizer}) {
	const element = useRef(null)

	let currentSize = size
	let currentOffset = parseInt(size) / 2
	let currentContainerRect = containerRect
	let currentMouseX;
	const adjustedX = parseInt(x) + currentOffset

	function getSize() {
		return element.current.clientWidth
	}
	function getOffset() {
		return (getSize() / 2)
	}
	const getRect = () => element.current.getBoundingClientRect()

	function isCollision(mouseX) {
		const rect = getRect()
		const mouseIntent = mouseX - currentMouseX	// +1 for right
		if (rect.right >= currentContainerRect.right && mouseIntent > 0 
			|| rect.left <= currentContainerRect.left && mouseIntent < 0)
			return true
		else return false
	}

	function handleDown(e) {
		currentContainerRect = getContainerRect()
		currentOffset = getOffset()
		handleClickDrag(drag)
	}
	function drag(e) {
		const mouseX = e.clientX - currentContainerRect.left - currentOffset
		if (isCollision(mouseX)) return
		currentMouseX = mouseX
		mover(element.current, mouseX)
	}
	function handleTouch(e) {
		currentContainerRect = getContainerRect()
		currentOffset = getOffset()
		handleTouchDrag(touchDrag)
	}
	function touchDrag(e) {
		const touchX = e.touches[0].clientX - currentContainerRect.left - currentOffset
		if (isCollision(touchX)) return
		currentMouseX = touchX
		mover(element.current, touchX)
	}
	
	return (
		<div ref={element} className={className + ' nap'} 
			style={{left: adjustedX + 'px'}}>
			<ResizeHandle />
			<div 
				onMouseDown={handleDown}
				onTouchStart={handleTouch}
				className='label'>nap
			</div>
			<ResizeHandle containerRect={containerRect} mover={mover} sizer={sizer} parent={element.current} />
		</div>
	)
}