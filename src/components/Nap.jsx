import {useRef} from 'react'
import ResizeHandle from './ResizeHandle'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'

export default function Nap({className, x , size, containerRect, getContainerRect, mover, sizer}) {
	const element = useRef(null)

	const offset = parseInt(size) / 2
	const adjustedX = parseInt(x) + offset

	function getSize() {
		return element.current.clientWidth
	}
	function getOffset() {
		return (getSize() / 2)
	}

	function handleDown(e) {
		handleClickDrag(drag)
	}
	function drag(e) {
		const mouseX = e.clientX - getContainerRect().left - getOffset()
		mover(element.current, mouseX)
	}
	function handleTouch(e) {
		handleTouchDrag(touchDrag)
	}
	function touchDrag(e) {
		const touchX = e.touches[0].clientX - getContainerRect().left - getOffset()
		mover(element.current, touchX)
	}
	
	return (
		<div ref={element} className={className + ' nap'} 
			style={{left: adjustedX + 'px'}}
		>
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