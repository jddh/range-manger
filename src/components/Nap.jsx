import {forwardRef, useRef, useImperativeHandle, useState} from 'react'
import classNames from 'classnames'
import ResizeHandle from './ResizeHandle'
import * as Units from '../functions/units'
import { gridSnap } from '../functions/geometry'
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

export default forwardRef(function ({fixed, className, x , size, containerRect, getContainerRect, mover, sizer, downHandler, resizeDownHandler, id, factive, currentBounds, timeRange, units}, ref) {
	const element = useRef(null)
	useImperativeHandle(ref, () => ({getBounds: getBounds, el: element.current, id: id}))
	const [startBound, setStartBound] = useState()
	const [dynamicBounds, setdynamicBounds] = useState()

	Units.setUnit(units)
	Units.setRange(timeRange)

	let currentOffset = parseInt(size) / 2
	// let currentContainerRect = getContainerRect()
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
		const leftOffset = -.65	// will increase towards edges of container

		//TODO fix the pixel overshoot
		const container = getContainerRect()
		return rect ? {left: (rect.left) - container.left, right: rect.right - container.left, width: rect.width} : null
	}

	let step

	// timeout-based position tooltip
	if (factive) {
		// console.log('active');
		let currentContainerRect = getContainerRect()
		window['step' + id] = setInterval(() => {
			// console.log(getThisRect().left)
			const bounds = getBounds()
			const leftTime = Units.getUnitValue(getPerc(bounds.left, currentContainerRect.width))
			const rightTime = Units.getUnitValue(getPerc(bounds.right, currentContainerRect.width))
			const widthTime = Units.getUnitAmount(getPerc(bounds.width, currentContainerRect.width))

			element.current.querySelector('.active-label.left').innerText = leftTime
			element.current.querySelector('.active-label.size').innerText = widthTime
			element.current.querySelector('.active-label.right').innerText = rightTime
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

	const leftHandle = fixed != 'left' && fixed != 'both'
	const rightHandle = fixed != 'right' && fixed != 'both'
	const movableBody = !fixed
	
	return (
		<div ref={element} 
			className={classNames(className, {active: factive},'nap')} 
			style={{left: gridSnap(adjustedX) + '%', width: gridSnap(size) + '%'}}>
			{leftHandle &&
				<ResizeHandle downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} id={id} reverse/>
			}
			<div  
				onMouseDown={movableBody && handleDown}
				onTouchStart={movableBody && handleDown}
				className='body'>
			</div>

			{rightHandle &&
				<ResizeHandle containerRect={containerRect} downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} id={id} />
			}

			<div className="active-label left">{currentBounds && currentBounds.left}{dynamicBounds && dynamicBounds.left}</div>
			<div className="active-label size"></div>
			<div className="active-label right"></div>
		</div>
	)
})