import { useRef, useState, useEffect, Children, cloneElement } from 'react'
import Nap from './Nap'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import './ShiftSchedule.css'

function getRect(el) {
	return el.getBoundingClientRect()
}
function getOffset(el) {
	return (el.clientWidth / 2)
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

	function handleNapDown(e, clickedEl) {
		//create dynamic bounding box
		createTravelBounds([clickedEl])

		//register responsive boundaries
		currentContainerRect = getRect(container.current)
		movingOffset = getOffset(clickedEl)
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

		handleClickDrag(resizeNapIntent)
	}

	function createTravelBounds(activeEls) {
		const clickedEl = activeEls[0]
		let dynamicEls = napEls.current.filter(el => el != null && el != clickedEl)
		dynamicEls = [...new Set(dynamicEls)]	//unique
		const thisRect = getRect(clickedEl)
		let lefts = dynamicEls.map(n => n.getBoundingClientRect().right)
		lefts.push(rect.left)
		lefts = lefts.filter(e => e < thisRect.left)

		let rights = dynamicEls.map(n => n.getBoundingClientRect().left)
		rights.push(rect.right)
		rights = rights.filter(e => e > thisRect.right)

		const sortAsc = (a,b) => a-b
		movingRect = {left: lefts.sort(sortAsc)[lefts.length-1], right: rights.sort(sortAsc)[0]}
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
		//not necessary to pin to container here
		const mouseX = e.clientX - currentContainerRect.left - movingOffset
		if (isCollision(mouseX)) return
		currentMouseX = mouseX
		moveElement(movingEls[0], mouseX)
	}

	function resizeNapIntent(e) {
		const delta = e.clientX - resizeStartX
		if (isCollision(e.clientX)) return
		currentMouseX = e.clientX
		resizeElement(movingEls[0], resizeStartWidth + delta)
	}

	function moveElement(el, x) {
		if (!el) return
		el.style.left = x + 'px'
	}

	function resizeElement(el, x) {
		if (!el) return
		el.style.width = x + 'px'
	}

	return (
		<div className="shifts" ref={container}>
			{Children.map(children, (child, index) => 
				<Nap 
					containerRect={rect} 
					getContainerRect={getRect} 
					mover={moveElement} 
					sizer={resizeElement}
					downHandler={handleNapDown} 
					resizeDownHandler={handleNapResizeDown}
					ref={(element) => napEls.current.push(element)} 
					{...child.props} />
			)}
		</div>
	)
}