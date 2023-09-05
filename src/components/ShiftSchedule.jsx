import { useRef, useState, useEffect, Children, cloneElement } from 'react'
import Nap from './Nap'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createBounds, getRect} from '../functions/geometry'
import './ShiftSchedule.css'

function getOffset(el, e) {
	return (e.clientX - getRect(el).left)
}

export default function ShiftSchedule({children}) {
	const container = useRef(null)
	const napEls = useRef(new Array())
	const [rect, setRect] = useState()

	//memory vars for event handlers
	let currentMouseX, 			//last mouse x pos
	movingOffset, 				//middle position of moving els
	currentContainerRect, 		//rect of nap holder
	movingEls, 					//array of moving els
	movingRect, 				//boundary rect for movingEls
	resizeEl, 					//el being resized
	resizeStartWidth,			//width before resize
	resizeStartX,				//mouse x before resize
	reverseResize				//reverse resize from left


	useEffect(function() {
		setRect(container.current.getBoundingClientRect())
	}, [])

	function handleNapDown(e, clickedEl, callback) {
		//create dynamic bounding box
		createTravelBounds([clickedEl])

		//register responsive boundaries
		currentContainerRect = getRect(container.current)
		movingOffset = getOffset(clickedEl, e)
		movingEls = [clickedEl]

		//activate drag handler
		handleClickDrag(moveNapIntent)
	}

	function handleNapResizeDown(e, clickedEl, reverse = false) {
		createTravelBounds([clickedEl])
		movingEls = [clickedEl]
		reverseResize = reverse
		resizeStartX = e.clientX
		resizeStartWidth = clickedEl.offsetWidth
		currentMouseX = e.clientX

		handleClickDrag(resizeNapIntent)
	}

	function upFn() {
		napEls.current.forEach(ne => {
			if (ne) {
				console.log(ne.getBounds())
			}
		})
	}

	/**
	 * calculate dynamic left & right bounds based on container and/or adjacent elements
	 * @param {array} activeEls 
	 */
	function createTravelBounds(activeEls) {
		const clickedEl = activeEls[0]
		let otherEls = napEls.current.filter(el => el != null && !activeEls.includes(el.el))
		otherEls = otherEls.map(el => el.el)
		otherEls = [...new Set(otherEls)]	//unique
		movingRect = createBounds(otherEls, activeEls, container.current)

	}

	function isCollision(mouseX) {
		const rect = getRect(movingEls[0])
		const mouseIntent = mouseX - currentMouseX	// +1 for right
		if (rect.right >= movingRect.right && mouseIntent > 0 
			|| rect.left <= movingRect.left && mouseIntent < 0)
			return true
		else return false
	}

	function moveNapIntent(e) {
		const mouseX = e.clientX - currentContainerRect.left - movingOffset
		if (isCollision(mouseX)) return
		currentMouseX = mouseX
		moveElement(movingEls[0], mouseX)
	}

	function resizeNapIntent(e) {
		let delta = e.clientX - resizeStartX
		if (reverseResize) delta *= -1
		if (isCollision(e.clientX)) return
		const reverseMotion = reverseResize ? e.clientX - currentMouseX : false
		currentMouseX = e.clientX

		resizeElement(movingEls[0], resizeStartWidth + delta, reverseMotion)
	}

	function moveElement(el, x) {
		if (!el) return
		el.style.left = x + 'px'
	}

	function resizeElement(el, x, reverse) {
		if (!el) return
		el.style.width = x + 'px'
		if (reverse) {
			el.style.left = parseInt(el.style.left) + reverse + 'px'
		}
	}

	return (
		<>
		<div className="shifts" ref={container}>
			{Children.map(children, (child, index) => 
				<Nap 
					containerRect={rect} 
					getContainerRect={() => getRect(container.current)} 
					mover={moveElement} 
					sizer={resizeElement}
					downHandler={handleNapDown} 
					resizeDownHandler={handleNapResizeDown}
					ref={(element) => napEls.current.push(element)} 
					key={index}
					{...child.props} />
			)}
		</div>
		<div className="thumb">move all</div>
		</>
	)
}