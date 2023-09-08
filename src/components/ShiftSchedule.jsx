import { useRef, useState, useEffect, Children, cloneElement } from 'react'
import Nap from './Nap'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createBounds, getRect, createAggregateDimensions} from '../functions/geometry'
import * as Units from '../functions/units'
import './ShiftSchedule.css'

function getOffsets(els, e) {
	const offsets = els.map(el => e.clientX - createAggregateDimensions([el]).left)
	return offsets
}

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

export default function ShiftSchedule({units, children}) {
	const container = useRef(null)
	const napEls = useRef(new Array())
	const [rect, setRect] = useState()
	const [napData, setNapData] = useState([])
	const [refsconnect, setRefsconnect] = useState(false)

	//runtime test
	// console.log(Units.getUnitValue(getPerc(40,100, '')));

	//memory vars for event handlers
	let currentMouseX, 			//last mouse x pos
	movingOffset, 				//middle position of moving els
	currentContainerRect, 		//rect of nap holder
	movingEls, 					//array of moving els
	movingRect,					//aggregate moving object
	movingOffsets,				//array of mouse pos offsets
	boundingRect, 				//boundary rect for movingEls
	activeIDs,					//array of nap ids moving
	resizeEl, 					//el being resized
	resizeStartWidth,			//width before resize
	resizeStartX,				//mouse x before resize
	reverseResize				//reverse resize from left

	//set time range of container
	Units.setRange([40,80])

	useEffect(function() {
		setRect(container.current.getBoundingClientRect())

		const ids = 'abcdefghijklmnopq'.split('');
		const items = Children.map(children, (c) => ({id: ids.shift(), ...c.props}))

		setNapData([...items])
	}, [])

	useEffect(() => {
		if (napEls.current.length && napData?.length) updateRefs()
	}, [napData])

	function pxToCq(px, container = rect.width) {
		return getPerc(px, container) + 'cqi'
	}

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
			item.getBounds = napEls.current[ix].getBounds;
			return i;
		  })
		);
		setRefsconnect(true);
	}

	//refs will be lost on hmr
	if (import.meta.hot) {
		import.meta.hot.on('hmr-update', (data) => {
			updateRefs()
		})
	}

	function getNap(id) {
		const ix = napData.findIndex((e) => e.id == id);
		return napData[ix]
	}

	function setNap(props, id) {
		const ix = napData.findIndex((e) => e.id == id);
		let data = [...napData]
		data[ix] = {...data[ix], ...props}
		setNapData(data)
	}
	function setNaps(naps) {
		let data = [...napData]
		naps.forEach(([props, id]) => {
			const ix = data.findIndex((e) => e.id == id);
			data[ix] = {...data[ix], ...props}
		})
		
		setNapData(data)
	}

	function testButton(e) {
		console.log(napData)
	}

	function handleNapDown(e, clickedEl, id) { 
		//create dynamic bounding box
		createTravelBounds([clickedEl])

		//register responsive boundaries
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets([clickedEl], e)
		// console.log(movingOffset)
		movingEls = [clickedEl]
		movingRect = createAggregateDimensions(movingEls)
		activeIDs = [id]

		//activate drag handler
		handleClickDrag(moveNapIntent, releaseNap)
	}

	function releaseNap() {
		let napsToUpdate = []
		activeIDs.forEach(id => {
			const nap = getNap(id)
			const left = getPerc(nap.getBounds().left, currentContainerRect.width)
			napsToUpdate.push([{x: left}, id])
		})
		setNaps(napsToUpdate)
	}

	function handleMoveAllDown(e) {
		movingEls = napData.map(nd => nd.el)
		activeIDs = napData.map(nd => nd.id)
		createTravelBounds(movingEls)
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets(movingEls, e)

		handleClickDrag(moveNapIntent, releaseNap)
	}

	function handleNapResizeDown(e, clickedEl, reverse = false) {
		createTravelBounds([clickedEl])
		movingEls = [clickedEl]
		reverseResize = reverse
		resizeStartX = e.clientX
		resizeStartWidth = clickedEl.offsetWidth
		currentMouseX = e.clientX 
		currentContainerRect = getRect(container.current)

		handleClickDrag(resizeNapIntent)
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
		el.style.left = pxToCq(x, currentContainerRect.width)
	}

	function resizeElement(el, x, reverse) {
		if (!el) return
		// el.style.width = x + 'px'
		el.style.width = pxToCq(x, currentContainerRect.width)
		if (reverse) {
			// el.style.left = parseInt(el.style.left) + reverse + 'px'
			el.style.left = parseFloat(el.style.left) + getPerc(reverse, currentContainerRect.width) + 'cqi'
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
					{...child} />
			)}
		</div>
		<div className="thumb" onMouseDown={handleMoveAllDown}>move all</div>
		<button onClick={testButton} style={{marginTop: '50px'}}>push me</button>
		<div className="data-panels">
			{napData.map((child, index) => 
				<div className="data-panel" key={child.id}>
					<h4>Span {index+1}</h4>
					<input value={Units.getUnitValue(child.x)} type='text' disabled />
				</div>
			)}
		</div>
		</>
	)
}