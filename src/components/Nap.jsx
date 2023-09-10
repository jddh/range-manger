import {forwardRef, useRef, useImperativeHandle, useState} from 'react'
import ResizeHandle from './ResizeHandle'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'

export default forwardRef(function ({className, x , size, containerRect, getContainerRect, mover, sizer, downHandler, resizeDownHandler, id}, ref) {
	const element = useRef(null)
	useImperativeHandle(ref, () => ({getBounds: getBounds, el: element.current, id: id}))
	const [startBound, setStartBound] = useState()

	let currentOffset = parseInt(size) / 2
	let currentContainerRect = containerRect
	const adjustedX = x

	function getSize() {
		return element.current?.clientWidth
	}
	function getOffset() {
		return (getSize() / 2)
	}
	function getThisRect() {
		return element.current?.getBoundingClientRect()
	}
	function getBounds() {
		const rect = getThisRect()
		if (!rect) return null
		const container = getContainerRect()
		return rect ? {left: rect.left - container.left, right: rect.right, width: rect.width} : null
	}

	function handleDown(e) {
		downHandler(e, element.current, id)
	}
	
	function handleTouch(e) {
		downHandler(e, element.current, id)
	}
	
	return (
		<div ref={element} className={className + ' nap'} 
		style={{left: adjustedX + 'cqi', width: size + 'cqi'}}>
			<ResizeHandle downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} id={id} reverse/>
			<div 
				onMouseDown={handleDown}
				onTouchStart={handleDown}
				className='label'>
			</div>
			<ResizeHandle containerRect={containerRect} downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} id={id} />
		</div>
	)
})