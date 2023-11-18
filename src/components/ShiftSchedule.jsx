import { useRef, useState, useEffect, Children, cloneElement, useMemo } from 'react'
import ShortUniqueId from 'short-unique-id'
import classNames from 'classnames'
import Nap from './Nap'
import Gradiation from './Gradiation'
import GradiationBee from './GradiationBee'
import DataPanel from './DataPanel'
import useSemiPersistentState from '../hooks/semiPersistentState'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createLimits, getRect, createAggregateDimensions, gridSnap} from '../functions/geometry'
import * as Units from '../functions/units'
import { hexToRgb, arraysEqual } from '../functions/utilities'
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

function sortXAsc(array) {
	return array.sort((a,b) => {
		return (a.x < b.x) ? -1 : 1
	})
}

const uid = new ShortUniqueId({ length: 10 })

const defaultNapProps = {color: '#96D3FF'}

export default function ShiftSchedule({
		disableTouchDrag = true,
		maxItems = 5,
		units, 
		onChange,
		children
	}) {
	const container = useRef(null)
	const napEls = useRef(new Array())
	const [containerRect, setRect] = useState()
	const [napData, setNapData] = useSemiPersistentState('napData', [], 'factive')
	const [napElLookup, setNapElLookup] = useState([])
	const [refsconnect, setRefsconnect] = useState(false)
	const [dragging, setDragging] = useState(false)
	const [activeInfoWindow, setActiveInfoWindow] = useState(false)
	const lastDataPoll = useRef(napData)

	//runtime test
	// console.log(Units.getUnitValue(getPerc(40,100, '')));

	//memory vars for event handlers
	let currentMouseX, 			//last mouse x pos
	currentContainerRect, 		//rect of nap holder
	limitRect, 					//limit rect for movingEls
	movingEls, 					//array of moving els
	movingRect,					//aggregate moving object
	movingOffsets,				//array of mouse pos offsets relative to moving els
	activeIDs,					//array of nap ids moving
	resizeStartWidth,			//width before resize
	resizeStartX,				//mouse x before resize
	reverseResize,				//reverse resize from left
	initClientX,
	lastActionTimeStamp
	

	//set time range of container
	const myUnit = 'time'
	// const myUnit = 'numerical'
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

		const items = Children.map(children, (c, i) => {
			let formattedChild = {
				id: uid.rnd(), 
				...c.props,
				x: parseInt(c.props.x),
				size: parseInt(c.props.size),
				name: `Span ${i+1}`,
				...defaultNapProps
				}

			if (napData && napData[i]) formattedChild = {...formattedChild, ...napData[i], factive: false}
			return formattedChild
		})

		sortXAsc(items)

		setNapData(items) 
	}, [])

	useEffect(() => {
		if (napEls.current.length && napData?.length) updateRefs()

		if (onChange && lastDataPoll.current && !arraysEqual(napData, lastDataPoll.current)) {
			onChange(napData)
		}

		lastDataPoll.current = [...napData]
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
		if (refsconnect && napElLookup.length == napData.length) return;
		const validNapEls = napEls.current.filter(e => e)
		setNapElLookup(
			napData.map((i) => {
			  let item = {}
			  const ix = validNapEls.findIndex(e => e.id == i.id)
			  item.id = i.id
			  item.el = validNapEls[ix].el
			  item.getBounds = validNapEls[ix].getBounds
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

	function addNap({x, size = 10, fixed}) {
		//BUG: add to single nap crashes

		//pick largest gap
		const gaps = napData.map((n,i) => {
			if (i == 0) return 0
			return {i: i-1, gap: n.x - (napData[i-1].x + napData[i-1].size)}
		}).filter(n => n)
		.sort((a,b) => a.gap < b.gap ? 1 : -1)
		const gap = gaps[0]
		x = napData[gap.i].x + napData[gap.i].size + 1
		if (gap.gap < 10) size = gap.gap - 4


		let newNaps = [...napData]
		newNaps.push({
			x: x, 
			size: size, 
			fixed: fixed, 
			name: `Span ${napData.length+1}`,
			id: uid.rnd(),
			...defaultNapProps
		})
		sortXAsc(newNaps)
		setNapData(newNaps)
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
		//create dynamic limit box
		createTravelLimits([clickedEl])
		featureInfoWindow(id)

		//register responsive boundaries
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets([clickedEl], e)
		movingEls = [clickedEl]
		movingRect = createAggregateDimensions(movingEls)
		activeIDs = [id]
		lastActionTimeStamp = new Date().getTime()
		setNap({factive: true}, id)
		initClientX = getClientX(e)
		setDragging(true)

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

		setDragging(false)
		setNaps(napsToUpdate)
	}

	function handleMoveAllDown(e) {
		initClientX = getClientX(e)
		movingEls = napData.map(({id, fixed}) => !fixed ? getNapRef(id).el : null
		).filter(el => el)
		activeIDs = napData.map(({id, fixed}) => !fixed ? id : null).filter(id => id)
		createTravelLimits(movingEls)
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets(movingEls, e)
		setNaps(napData.map(nd => [{factive: true}, nd.id]))

		if (e.touches) handleTouchDrag(moveNapIntent, releaseNap)
		else handleClickDrag(moveNapIntent, releaseNap)
	}

	function handleNapResizeDown(e, clickedEl, reverse = false, id) {
		let clientX = getClientX(e)
		initClientX = getClientX(e)
		createTravelLimits([clickedEl])
		featureInfoWindow(id)
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
	 * calculate dynamic left & right limits based on container and/or adjacent elements
	 * @param {array} activeEls 
	 */
	function createTravelLimits(activeEls) {
		const otherEls = napElLookup.map(({el}) => el).filter(el => !activeEls.includes(el))

		limitRect = createLimits(otherEls, activeEls, container.current)
	}

	function isCollision(mouseX) {
		const rect = createAggregateDimensions(movingEls)
		const mouseIntent = mouseX - currentMouseX	// +1 for right
		if (rect.right + mouseIntent >= limitRect.right && mouseIntent > 0)
			return 'right';
		if(rect.left + mouseIntent <= limitRect.left && mouseIntent < 0)
			return 'left'
		else return false
	}

	function snapToLimit(mouseX, action = 'move') {
		const direction = (mouseX - currentMouseX > 0) ? 'right': 'left'
		const rect = createAggregateDimensions(movingEls)
		const width = rect.right - rect.left
		const distance = (direction == 'left') ? 
			rect.left - limitRect.left :
			limitRect.right - rect.right
		if (distance < 2) return
		movingEls.forEach(me => {
			const meRect = getRect(me)
			const snapX = (direction == 'left') ?
				meRect.left - distance - currentContainerRect.left :
				meRect.left + distance - currentContainerRect.left
			const snapSize = meRect.width + distance
			if (action == 'resize')
				resizeElement(me, snapSize, (direction == 'left') && true)
			else moveElement(me, snapX)
		})
	}

	function moveNapIntent(e) {
		let clientX = getClientX(e)
		if (isCollision(clientX)) 
			{snapToLimit(clientX); return}
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
			|| (collide == 'right' && !reverseResize)) {
			snapToLimit(clientX, 'resize')
			return
		}
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

	function toggleInfoWindow(id, leftBound) {
		if ((id && activeInfoWindow && id != activeInfoWindow[0]) || id && !activeInfoWindow)
			{
				setActiveInfoWindow([id, leftBound])
			}
		else setActiveInfoWindow()
	}

	function featureInfoWindow(id) {
		if (activeInfoWindow && activeInfoWindow[0] != id)
			setActiveInfoWindow()
	}

	return (
		<div className={classNames({'disable-touch-drag': disableTouchDrag}, 'range-slider')}>
		<div className={classNames({'drag': dragging, 'disable-touch-drag': disableTouchDrag}, 'shifts', 'ui')} ref={container}>
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
					toggleInfoWindow={toggleInfoWindow}
					{...child} />
			)}
			<Gradiation interval={120} units={myUnit} range={myRange} />
			{/* <GradiationBee  value="1100" units={myUnit} range={myRange}/>
			<GradiationBee  value="1300" units={myUnit} range={myRange}/>
			<GradiationBee  value="1500" units={myUnit} range={myRange}/>
			<GradiationBee  value="1700" units={myUnit} range={myRange}/> */}
		</div>

		<div className="thumb ui" onMouseDown={handleMoveAllDown} onTouchStart={handleMoveAllDown}>move all</div>

		<DataPanel 
			spanData={napData} 
			units={myUnit} 
			range={myRange}
			updateData={setNap}
			deleteData={removeNap}
			newSpan={addNap}
			maxItems={maxItems}
			activeInfoWindow={activeInfoWindow} 
			setActiveInfoWindow={setActiveInfoWindow} />
		<button onClick={testButton} style={{marginTop: '50px'}}>push me</button>
		</div>
	)
}