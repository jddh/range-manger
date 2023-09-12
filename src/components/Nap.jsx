import {forwardRef, useRef, useImperativeHandle, useState} from 'react'
import classNames from 'classnames'
import ResizeHandle from './ResizeHandle'
import * as Units from '../functions/units'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'

function getPerc(px, total, style = '') {
	let perc = px / total
	switch(style) {
		case '%':
			perc = perc * 100 + '%'
		break
		case '':
			perc = perc * 100
	}
	return perc
}

export default forwardRef(function ({className, x , size, containerRect, getContainerRect, mover, sizer, downHandler, resizeDownHandler, id, factive, currentBounds, timeRange}, ref) {
	const element = useRef(null)
	useImperativeHandle(ref, () => ({getBounds: getBounds, el: element.current, id: id}))
	const [startBound, setStartBound] = useState()
	const [dynamicBounds, setdynamicBounds] = useState()

	Units.setRange(timeRange)

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

	let step

	// timeout-based position tooltip
	if (factive) {
		// console.log('active');
		window['step' + id] = setInterval(() => {
			// console.log(getThisRect().left)
			const bounds = getBounds()
			const leftTime = Units.getUnitValue(getPerc(bounds.left, currentContainerRect.width))
			element.current.querySelector('.active-label').innerText = leftTime
		}, 200)

	}
	else {
		// console.log('inactive');
		clearInterval(window['step' + id])
	}
	// end tooltip

	function handleDown(e) {
		downHandler(e, element.current, id)
	}
	
	function handleTouch(e) {
		downHandler(e, element.current, id)
	}
	
	return (
		<div ref={element} className={classNames(className, {active: factive},'nap')} 
		style={{left: adjustedX + 'cqi', width: size + 'cqi'}}>
			<ResizeHandle downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} id={id} reverse/>
			<div 
				onMouseDown={handleDown}
				onTouchStart={handleDown}
				className='label'>
			</div>
			<ResizeHandle containerRect={containerRect} downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} id={id} />
			<div className="active-label">{currentBounds && currentBounds.left}{dynamicBounds && dynamicBounds.left}</div>
		</div>
	)
})