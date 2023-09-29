import { useRef, useState, useEffect, Children, cloneElement } from 'react'
import Nap from './Nap'
import Gradiation from './Gradiation'
import GradiationBee from './GradiationBee'
import useSemiPersistentState from '../hooks/semiPersistentState'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createBounds, getRect, createAggregateDimensions} from '../functions/geometry'
import * as Units from '../functions/units'
import './ShiftSchedule.css'

function getOffsets(els, e) {
	const clientX = getClientX(e)
	const offsets = els.map(el => clientX - createAggregateDimensions([el]).left)
	return offsets
}

function getClientX(e) {
	//return e.clientX
	return e.touches ? e.touches[0].clientX : e.clientX
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
	// const [napData, setNapData] = useState([])
	const [napData, setNapData] = useSemiPersistentState('napData', [])
	const [napElLookup, setNapElLookup] = useState([])
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
	reverseResize,				//reverse resize from left
	lastActionTimeStamp 

	//set time range of container
	// const myRange = [40,80]
	const myRange = [Units.getPercentFromUnit('0800',[0,100]), Units.getPercentFromUnit('1800',[0,100])]
	Units.setRange(myRange)

	//temp log after range set
	// console.log(Units.getUnitAmount(20));

	useEffect(function() {
		setRect(container.current.getBoundingClientRect())

		const ids = 'abcdefghijklmnopq'.split('');
		const items = Children.map(children, (c, i) => {
			let formattedChild = {id: ids.shift(), ...c.props}
			if (napData && napData[i]) formattedChild = {...formattedChild, ...napData[i]}
			return formattedChild
		})

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
		// setNapData(
		//   napData.map((i) => {
		// 	let item = i;
		// 	const ix = napEls.current.findIndex((e) => e.id == i.id);
		// 	item.el = napEls.current[ix].el;
		// 	item.getBounds = napEls.current[ix].getBounds;
		// 	return i;
		//   })
		// );
		setNapElLookup(
			napData.map((i) => {
			  let item = {}
			  const ix = napEls.current.findIndex((e) => e.id == i.id)
			  item.id = i.id
			  item.el = napEls.current[ix].el
			  item.getBounds = napEls.current[ix].getBounds
			  return item;
			})
		);
		setRefsconnect(true);
	}

	function clearCache() {
		localStorage.clear()
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

	function getNapEl(id) {
		return napElLookup.filter(nte => nte.id == id).shift()
	}

	function setNap(props, id) {
		const ix = napData.findIndex((e) => e.id == id);
		let data = [...napData]
		data[ix] = {...data[ix], ...props}
		setNapData(data)
	}
	/**
	 * 
	 * @param {array} naps [props, id]
	 */
	function setNaps(naps) {
		let data = [...napData]
		naps.forEach(([props, id]) => {
			const ix = data.findIndex((e) => e.id == id);
			data[ix] = {...data[ix], ...props}
		})
		
		setNapData(data)
	}

	function testButton(e) {
		clearCache()
	}

	function handleNapDown(e, clickedEl, id) { 
		//create dynamic bounding box
		createTravelBounds([clickedEl])

		//register responsive boundaries
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets([clickedEl], e)
		movingEls = [clickedEl]
		movingRect = createAggregateDimensions(movingEls)
		activeIDs = [id]
		lastActionTimeStamp = new Date().getTime()
		setNap({factive: true}, id)

		//activate drag handler
		if (e.touches) handleTouchDrag(moveNapIntent, releaseNap)
		else handleClickDrag(moveNapIntent, releaseNap)
	}

	function releaseNap() {
		//TODO null mouse move inches elements larger; suspect unit conversion
		let napsToUpdate = []
		activeIDs.forEach(id => {
			const bounds = getNapEl(id).getBounds()
			const left = getPerc(bounds.left-1, currentContainerRect.width)
			const width = getPerc(bounds.width-1, currentContainerRect.width)
			napsToUpdate.push([{x: left, size: width}, id])
		})
		setNaps(napsToUpdate)
	}

	function handleMoveAllDown(e) {
		movingEls = napData.map(({id}) => getNapEl(id).el)
		activeIDs = napData.map(nd => nd.id)
		createTravelBounds(movingEls)
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets(movingEls, e)
		setNaps(napData.map(nd => [{factive: true}, nd.id]))

		if (e.touches) handleTouchDrag(moveNapIntent, releaseNap)
		else handleClickDrag(moveNapIntent, releaseNap)
	}

	function handleNapResizeDown(e, clickedEl, reverse = false, id) {
		let clientX = getClientX(e)
		createTravelBounds([clickedEl])
		movingEls = [clickedEl]
		activeIDs = [id]
		reverseResize = reverse
		resizeStartX = clientX
		resizeStartWidth = clickedEl.offsetWidth
		currentMouseX = clientX 
		currentContainerRect = getRect(container.current)
		setNap({factive: true}, id)

		if (e.touches) handleTouchDrag(resizeNapIntent, releaseNap)
		else handleClickDrag(resizeNapIntent, releaseNap)
	}

	/**
	 * calculate dynamic left & right bounds based on container and/or adjacent elements
	 * @param {array} activeEls 
	 */
	function createTravelBounds(activeEls) {
		let otherEls = napData.map(({id}) => getNapEl(id).el).filter(nd => !activeEls.includes(nd.el))

		boundingRect = createBounds(otherEls, activeEls, container.current)
	}

	function isCollision(mouseX) {
		//TODO repeated collide punches through
		//TODO why does the below fn need to be called again?
		const rect = createAggregateDimensions(movingEls)
		// const recst = movingRect
		const mouseIntent = mouseX - currentMouseX	// +1 for right
		if (rect.right + mouseIntent >= boundingRect.right && mouseIntent > 0 
			|| rect.left + mouseIntent <= boundingRect.left && mouseIntent < 0)
			return true
		else return false
	}

	function snapToBounds(mouseX) {
		const direction = (mouseX - currentMouseX > 0) ? 'right': 'left'
		const rect = createAggregateDimensions(movingEls)
		const distance = rect.left - boundingRect.left
		movingEls.forEach(me => moveElement(me, (rect.left - distance)))
	}

	function moveNapIntent(e) {
		let clientX = getClientX(e)
		if (isCollision(clientX)) return
		// {snapToBounds(clientX); return}
		currentMouseX = clientX
		movingEls.forEach((me, i) =>{
			const mouseX = clientX - currentContainerRect.left - movingOffsets[i]
			//state-based position tooltip
			// const now = new Date().getTime()
			// if (now - lastActionTimeStamp > 200) {
			// 	setNap({
			// 		currentBounds: {left: Units.getUnitValue(getPerc(getRect(me).left-currentContainerRect.left, currentContainerRect.width))},
			// 		factive: true
			// 	}, activeIDs[i])
			// lastActionTimeStamp = new Date().getTime()
			// }
			// end tooltip
			moveElement(me, mouseX)
		})
	}

	function resizeNapIntent(e) {
		let clientX = getClientX(e)
		let delta = clientX - resizeStartX
		if (reverseResize) delta *= -1
		if (isCollision(clientX)) return
		const reverseMotion = reverseResize ? clientX - currentMouseX : false
		currentMouseX = clientX

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
		<div className="shifts ui" ref={container}>
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
					// factive={child.factive}
					currentBounds={child.currentBounds}
					timeRange={myRange}
					{...child} />
			)}
			{/* <Gradiation count={6} units="time" range={myRange} /> */}
			<GradiationBee  value="1000" units="time" range={myRange}/>
			<GradiationBee  value="1300" units="time" range={myRange}/>
			<GradiationBee  value="1600" units="time" range={myRange}/>
		</div>
		<div className="thumb ui" onMouseDown={handleMoveAllDown} onTouchStart={handleMoveAllDown}>move all</div>
		<div className="data-panels">
			{napData.map((child, index) => 
				<div className="data-panel" key={child.id}>
					<h4>Span {index+1}</h4>
					<label >start </label><input value={Units.getUnitValue(child.x)} type='text' disabled />
					<label > end </label><input value={Units.getUnitValue(child.x + child.size)} type='text' disabled />
				</div>
			)}
		</div>
		<button onClick={testButton} style={{marginTop: '50px'}}>push me</button>
		</>
	)
}