import { useRef, useState, useEffect, Children, cloneElement } from 'react'
import Nap from './Nap'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createBounds, getRect, createAggregateDimensions} from '../functions/geometry'
import * as Unit from '../functions/units'
import './ShiftSchedule.css'

function getOffsets(els, e) {
	const offsets = els.map(el => e.clientX - createAggregateDimensions([el]).left)
	return offsets
}

function getPerc(px, total, style = '%') {
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

export default function ShiftSchedule({units, children}) {
	const container = useRef(null)
	const napEls = useRef(new Array())
	const [rect, setRect] = useState()
	const [napData, setNapData] = useState([])
	const [refsconnect, setRefsconnect] = useState(false)

	//runtime test
	console.log(Unit.getUnitValue(getPerc(48,100, '')));

	//memory vars for event handlers
	let currentMouseX, 			//last mouse x pos
	movingOffset, 				//middle position of moving els
	currentContainerRect, 		//rect of nap holder
	movingEls, 					//array of moving els
	movingRect,					//aggregate moving object
	movingOffsets,				//array of mouse pos offsets
	boundingRect, 				//boundary rect for movingEls
	resizeEl, 					//el being resized
	resizeStartWidth,			//width before resize
	resizeStartX,				//mouse x before resize
	reverseResize				//reverse resize from left


	useEffect(function() {
		setRect(container.current.getBoundingClientRect())

		const ids = 'abcdefghijklmnopq'.split('');
		const items = Children.map(children, (c) => ({id: ids.shift(), ...c.props}))
		setNapData([...items])
	}, [])

	useEffect(() => {
		if (napEls.current.length && napData?.length) updateRefs()
	}, [napData])

	/**
	 * connect refs sent back from children to data
	 * @returns 
	 */
	function updateRefs() {
		if (refsconnect) return;
		setNapData(
		  napData.map((i) => {
			let item = i;
			const ix = napEls.current.findIndex((e) => e.id == i.id);
			item.el = napEls.current[ix].el;
			// item.sayHello = els.current[ix].sayHello;
			return i;
		  })
		);
		setRefsconnect(true);
	}

	function handleNapDown(e, clickedEl, callback) {
		//create dynamic bounding box
		createTravelBounds([clickedEl])

		//register responsive boundaries
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets([clickedEl], e)
		// console.log(movingOffset)
		movingEls = [clickedEl]
		movingRect = createAggregateDimensions(movingEls)

		//activate drag handler
		handleClickDrag(moveNapIntent)
	}

	function handleMoveAllDown(e) {
		movingEls = napData.map(nd => nd.el)
		createTravelBounds(movingEls)
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets(movingEls, e)
		// console.log(movingOffset)
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
		let otherEls = napData.map(nd => nd.el).filter(nd => !activeEls.includes(nd.el))

		boundingRect = createBounds(otherEls, activeEls, container.current)
	}

	function isCollision(mouseX) {
		const rect = createAggregateDimensions(movingEls)
		const mouseIntent = mouseX - currentMouseX	// +1 for right
		if (rect.right >= boundingRect.right && mouseIntent > 0 
			|| rect.left <= boundingRect.left && mouseIntent < 0)
			return true
		else return false
	}

	function moveNapIntent(e) {
		if (isCollision(e.clientX)) return
		currentMouseX = e.clientX
		movingEls.forEach((me, i) =>{
			const mouseX = e.clientX - currentContainerRect.left - movingOffsets[i]
			moveElement(me, mouseX)
		})
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
			{napData.map((child, index) => 
				<Nap 
					containerRect={rect} 
					getContainerRect={() => getRect(container.current)} 
					mover={moveElement} 
					sizer={resizeElement}
					downHandler={handleNapDown} 
					resizeDownHandler={handleNapResizeDown}
					ref={(element) => napEls.current.push(element)} 
					key={child.id}
					id={child.id}
					{...child} />
			)}
		</div>
		<div className="thumb" onMouseDown={handleMoveAllDown}>move all</div>
		</>
	)
}