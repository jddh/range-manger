import { useRef, useState, useEffect, Children, cloneElement } from 'react'
import Nap from './Nap'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createBounds, getRect, createAggregateDimensions} from '../functions/geometry'
import './ShiftSchedule.css'

function getOffset(els, e) {
	return (e.clientX - createAggregateDimensions(els).left)
}

export default function ShiftSchedule({children}) {
	const container = useRef(null)
	const napEls = useRef(new Array())
	const [rect, setRect] = useState()
	const [napData, setNapData] = useState([])
	const [refsconnect, setRefsconnect] = useState(false)

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
		movingOffset = getOffset([clickedEl], e)
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
		let otherEls = napData.map(nd => nd.el).filter(nd => !activeEls.includes(nd.el))

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
		movingEls.forEach(me => moveElement(me, mouseX))
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
		<div className="thumb">move all</div>
		</>
	)
}