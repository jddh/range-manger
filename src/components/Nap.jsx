import {forwardRef, useRef, useImperativeHandle, useState, useMemo} from 'react'
import classNames from 'classnames'
import ResizeHandle from './ResizeHandle'
import * as Units from '../functions/units'
import { gridSnap } from '../functions/geometry'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import { hexToRgb, hexToHSL } from '../functions/utilities'

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

export default forwardRef(function (
	{
		fixed, className, x , size, containerRect, getContainerRect, mover, sizer, downHandler, resizeDownHandler, id, factive, currentBounds, timeRange, units, color, name
	}, ref) {
	const element = useRef(null)
	useImperativeHandle(ref, () => ({getBounds: getBounds, el: element.current, id: id}))
	const [startBound, setStartBound] = useState()
	const [dynamicBounds, setdynamicBounds] = useState()

	const rgbColour = useMemo(() => hexToRgb(color), [color])
	const hslColour = useMemo(() => hexToHSL(color, -10), [color])

	Units.setUnit(units)
	Units.setRange(timeRange)

	let currentOffset = parseInt(size) / 2
	const adjustedX = x

	function getThisRect() {
		return element.current?.getBoundingClientRect()
	}

	/**
	 * bounds relative to container
	 */
	function getBounds() {
		const rect = getThisRect()
		if (!rect) return null
		const leftOffset = -.65	// will increase towards edges of container

		const container = getContainerRect()
		return rect ? {left: (rect.left) - container.left, right: rect.right - container.left, width: rect.width} : null
	}

	let step

	// timeout-based position tooltip
	if (factive) {
		var currentContainerRect = getContainerRect()
		//first run immediately
		if (!window['step' + id]) updateToolTips()
		window['step' + id] = setInterval(() => {
			updateToolTips()
		}, 200)
	}
	else {
		clearInterval(window['step' + id])
	}

	function updateToolTips() {
		// console.log(getThisRect().left)
		const bounds = getBounds()
		const leftTime = Units.getUnitValue(getPerc(bounds.left, currentContainerRect.width))
		const rightTime = Units.getUnitValue(getPerc(bounds.right, currentContainerRect.width))
		const widthTime = Units.getUnitAmount(getPerc(bounds.width, currentContainerRect.width))

		element.current.querySelector('.active-label.left').innerText = leftTime
		element.current.querySelector('.active-label.size').innerText = widthTime
		element.current.querySelector('.active-label.right').innerText = rightTime
	}
	// end tooltip

	function handleDown(e) {
		downHandler(e, element.current, id)
	}

	const leftHandle = fixed != 'left' && fixed != 'both'
	const rightHandle = fixed != 'right' && fixed != 'both'
	const movableBody = !fixed
	
	return (
		<div ref={element} 
			className={classNames(className, {active: factive},'nap')} 
			style={{
				left: gridSnap(adjustedX) + '%', 
				width: gridSnap(size) + '%',
				'--base-bg-color': rgbColour,
				'--base-bg-hsl': hslColour
			}}>
			<div className="label">{name}</div>
			{leftHandle &&
				<ResizeHandle downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} id={id} reverse/>
			}
			<div  
				onMouseDown={movableBody ? handleDown : null}
				onTouchStart={movableBody ? handleDown : null}
				className='body'>
			</div>

			{rightHandle &&
				<ResizeHandle containerRect={containerRect} downHandler={resizeDownHandler} mover={mover} sizer={sizer} parent={element.current} className="last" id={id} />
			}

			<div className="active-label left">{currentBounds && currentBounds.left}{dynamicBounds && dynamicBounds.left}</div>
			<div className="active-label size"></div>
			<div className="active-label right"></div>
		</div>
	)
})