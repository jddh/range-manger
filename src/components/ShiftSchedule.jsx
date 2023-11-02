import { useRef, useState, useEffect, Children, cloneElement, useMemo } from 'react'
import ShortUniqueId from 'short-unique-id';
import Nap from './Nap'
import Gradiation from './Gradiation'
import GradiationBee from './GradiationBee'
import DataPanel from './DataPanel'
import useSemiPersistentState from '../hooks/semiPersistentState'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createBounds, getRect, createAggregateDimensions, gridSnap} from '../functions/geometry'
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

function clearCache() {
	localStorage.clear()
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

const uid = new ShortUniqueId({ length: 10 })

export default function ShiftSchedule({units, children}) {
	const container = useRef(null)
	const napEls = useRef(new Array())
	const [containerRect, setRect] = useState()
	const [napData, setNapData] = useSemiPersistentState('napData', [], 'factive')
	const [napElLookup, setNapElLookup] = useState([])
	const [refsconnect, setRefsconnect] = useState(false)

	//runtime test
	// console.log(Units.getUnitValue(getPerc(40,100, '')));

	//memory vars for event handlers
	let currentMouseX, 			//last mouse x pos
	movingOffset, 				//middle position of moving els
	currentContainerRect, 		//rect of nap holder
	boundingRect, 				//boundary rect for movingEls
	movingEls, 					//array of moving els
	movingRect,					//aggregate moving object
	movingOffsets,				//array of mouse pos offsets relative to moving els
	activeIDs,					//array of nap ids moving
	resizeEl, 					//el being resized
	resizeStartWidth,			//width before resize
	resizeStartX,				//mouse x before resize
	reverseResize,				//reverse resize from left
	initClientX,
	lastActionTimeStamp 

	//set time range of container
	// const myRange = [40,80]
	const myUnit = 'time'
	Units.setUnit(myUnit)
	const myRange = [Units.getPercentFromUnit('700',[0,100]), Units.getPercentFromUnit('2100',[0,100])]
	// const myRange = [0,1000]
	Units.setRange(myRange)

	//temp log after range set
	// console.log(Units.getUnitAmount(20));

	useEffect(function() {
		//create data from component children
		setRect(container.current.getBoundingClientRect())
		if (napData.length) {
			updateRefs()
			return
		}

		const ids = 'abcdefghijklmnopq'.split('');
		const items = Children.map(children, (c, i) => {
			let formattedChild = {
				id: uid.rnd(), 
				...c.props,
				x: parseInt(c.props.x),
				size: parseInt(c.props.size),
				}

			if (napData && napData[i]) formattedChild = {...formattedChild, ...napData[i], factive: false}
			return formattedChild
		})

		setNapData(items) 
	}, [])

	useEffect(() => {
		if (napEls.current.length && napData?.length) updateRefs()
	}, [napData])

	function pxToCq(px, container = containerRect.width) {
		return getPerc(px, container) + 'cqi'
	}

	function pxToPer(px, container = containerRect.width, suffix = '%') {
		return gridSnap(getPerc(px, container)) + suffix
	}

	/**
	 * connect refs sent back from children to data
	 * @returns 
	 */
	function updateRefs() {
		if (refsconnect) return;
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

	function getNapRef(id) {
		return napElLookup.filter(nte => nte.id == id).shift()
	}

	function setNap(props, id) {
		const ix = napData.findIndex((e) => e.id == id)
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
			const ix = data.findIndex((e) => e.id == id)
			data[ix] = {...data[ix], ...props}
		})
		
		setNapData(data)
	}

	//TODO data panels are listed by order of data, which ends up not syncing with order of elements
	function addNap({x, size = 10, fixed}) {
		let naps = napData.toSorted((a,b) => {
			return (a.x+a.size > b.x+b.size) ? -1 : 1
		})
		naps = naps.filter(n => n.x + n.size < 90)
		if (!x) x = naps[0].x + naps[0].size + 5
		setNapData([...napData, {x: x, size: size, fixed: fixed, id: uid.rnd()}])
		// console.log(naps);
	}

	function removeNap(id) {
		let data = [...napData]
		const ix = data.findIndex((e) => e.id == id)
		data.splice(ix, 1)
		setNapData(data)
	}

	function testButton(e) {
		clearCache()
		// console.log(napElLookup);
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
		initClientX = getClientX(e)

		//activate drag handler
		if (e.touches) handleTouchDrag(moveNapIntent, releaseNap)
		else handleClickDrag(moveNapIntent, releaseNap)
	}

	function releaseNap(e) {
		let napsToUpdate = []
		//if cursor has actually moved
		//TODO touch needs a bigger null zone
		if (e.clientX ) {
		activeIDs.forEach(id => {
			const bounds = getNapRef(id).getBounds()
			const left = getPerc(bounds.left, currentContainerRect.width)
			const width = getPerc(bounds.width, currentContainerRect.width)
			napsToUpdate.push([{x: left, size: width}, id])
		}) }
		else {
			napsToUpdate = activeIDs.map(id => [{factive: false}, id])
		}
		setNaps(napsToUpdate)
	}

	function handleMoveAllDown(e) {
		initClientX = getClientX(e)
		movingEls = napData.map(({id, fixed}) => !fixed ? getNapRef(id).el : null
		).filter(el => el)
		activeIDs = napData.map(({id, fixed}) => !fixed ? id : null).filter(id => id)
		createTravelBounds(movingEls)
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets(movingEls, e)
		setNaps(napData.map(nd => [{factive: true}, nd.id]))

		if (e.touches) handleTouchDrag(moveNapIntent, releaseNap)
		else handleClickDrag(moveNapIntent, releaseNap)
	}

	function handleNapResizeDown(e, clickedEl, reverse = false, id) {
		let clientX = getClientX(e)
		initClientX = getClientX(e)
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
		const otherEls = napElLookup.map(({el}) => el).filter(el => !activeEls.includes(el))

		boundingRect = createBounds(otherEls, activeEls, container.current)
	}

	function isCollision(mouseX) {
		const rect = createAggregateDimensions(movingEls)
		const mouseIntent = mouseX - currentMouseX	// +1 for right
		if (rect.right + mouseIntent >= boundingRect.right && mouseIntent > 0)
			return 'right';
		if(rect.left + mouseIntent <= boundingRect.left && mouseIntent < 0)
			return 'left'
		else return false
	}

	function snapToBounds(mouseX) {
		const direction = (mouseX - currentMouseX > 0) ? 'right': 'left'
		const rect = createAggregateDimensions(movingEls)
		const width = rect.right - rect.left
		const distance = (direction == 'left') ? 
			rect.left - boundingRect.left :
			boundingRect.right - rect.right
			// console.log(distance);
		if (distance < 2) return
		movingEls.forEach(me => {
			const meRect = getRect(me)
			const snapX = (direction == 'left') ?
				meRect.left - distance - currentContainerRect.left :
				meRect.left + distance - currentContainerRect.left
			moveElement(me, snapX)
		})
	}

	function moveNapIntent(e) {
		let clientX = getClientX(e)
		if (isCollision(clientX)) 
		{snapToBounds(clientX); return}
		currentMouseX = clientX
		movingEls.forEach((me, i) => {
			const mouseX = clientX - currentContainerRect.left - movingOffsets[i]
			moveElement(me, mouseX)
		})
	}

	function resizeNapIntent(e) {
		let clientX = getClientX(e)
		let delta = clientX - resizeStartX
		if (reverseResize) delta *= -1
		const collide = isCollision(clientX)
		if ((collide == 'left' && reverseResize)
			|| (collide == 'right' && !reverseResize)) return
		const reverseMotion = reverseResize ? clientX - currentMouseX : false
		currentMouseX = clientX

		resizeElement(movingEls[0], resizeStartWidth + delta, reverseMotion)
	}
	
	function moveElement(el, x) {
		if (!el) return
		el.style.left = pxToPer(x, currentContainerRect.width)
	}

	function resizeElement(el, x, reverse) {
		if (!el) return
		// el.style.width = x + 'px'
		const currentWidth = parseFloat(el.style.width)
		const newWidth = pxToPer(x, currentContainerRect.width, '')
		const delta = newWidth - currentWidth
		el.style.width = currentWidth + delta + '%'
		if (reverse) {
			// el.style.left = parseInt(el.style.left) + reverse + 'px'
			el.style.left = parseFloat(el.style.left) - delta + '%'
		}
	}

	return (
		<>
		<div className="shifts ui" ref={container}>
			{napData.map((child, index) => 
				<Nap 
					fixed={child.fixed}
					containerRect={containerRect} 
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
					units={myUnit}
					{...child} />
			)}
			{/* <Gradiation count={6} units="time" range={myRange} /> */}
			<GradiationBee  value="1100" units={myUnit} range={myRange}/>
			<GradiationBee  value="1300" units={myUnit} range={myRange}/>
			<GradiationBee  value="1500" units={myUnit} range={myRange}/>
			<GradiationBee  value="1700" units={myUnit} range={myRange}/>
		</div>
		<div className="thumb ui" onMouseDown={handleMoveAllDown} onTouchStart={handleMoveAllDown}>move all</div>
		<DataPanel 
			spanData={napData} 
			units={myUnit} 
			range={myRange}
			updateData={setNap}
			deleteData={removeNap}
			newSpan={addNap} />
		<button onClick={testButton} style={{marginTop: '50px'}}>push me</button>
		</>
	)
}