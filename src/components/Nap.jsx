import {forwardRef, useRef, useImperativeHandle, useState} from 'react'
import ResizeHandle from './ResizeHandle'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'

export default forwardRef(function ({className, x , size, containerRect, getContainerRect, mover, sizer, downHandler, resizeDownHandler}, ref) {
	const element = useRef(null)
	useImperativeHandle(ref, () => ({getBounds: getBounds, el: element.current}))
	const [startBound, setStartBound] = useState()

	let currentOffset = parseInt(size) / 2
	let currentContainerRect = containerRect
	const adjustedX = parseInt(x) + currentOffset

	function getSize() {
		return element.current?.clientWidth
	}
	function getOffset() {
		return (getSize() / 2)
	}
	function getRect() {
		return element.current?.getBoundingClientRect()
	}
	function getBounds() {
		const rect = getRect()
		if (!rect) return null
		const container = getContainerRect()
		return rect ? [rect.left - container.left, rect.right] : null
	}

	function handleDown(e) {
		downHandler(e, element.current)
	}

	function handleUp(e) {
		console.log('up');
		setStartBound(getBounds()[0])
		// console.log(startBound);
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
			<ResizeHandle downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} reverse/>
			<div 
				onMouseDown={handleDown}
				// onMouseUp={handleUp}
				onTouchStart={handleTouch}
				className='label'>
			</div>
			<ResizeHandle containerRect={containerRect} downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} />
		</div>
	)
})