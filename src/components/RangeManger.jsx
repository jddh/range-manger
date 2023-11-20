import { useRef, useState, useEffect, Children, cloneElement, useMemo } from 'react'
import ShortUniqueId from 'short-unique-id'
import classNames from 'classnames'
import Range from './Range'
import Grades from './Gradiation'
import Grade from './Grade'
import DataPanel from './DataPanel'
import useSemiPersistentState from '../hooks/semiPersistentState'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'
import {createLimits, getRect, createAggregateDimensions, gridSnap} from '../functions/geometry'
import * as Units from '../functions/units'
import { hexToRgb, arraysEqual, convertToBooleanVars } from '../functions/utilities'
import './RangeManger.css'

function getOffsets(els, e) {
	const clientX = getClientX(e)
	const offsets = els.map(el => clientX - createAggregateDimensions([el]).left)
	return offsets
}

function getClientX(e) {
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

const defaultRangeProps = {color: '#96D3FF'}

export default function RangeManger({
		disableTouchDrag = true,
		maxItems = 5,
		units = 'time', 
		range = ['700','2100'],
		gradiation = 120,
		changeColor = true,
		addMore = true,
		showInfo = true,
		localStoreData = true,
		onChange,
		children
	}) {

	const [userChangeColor, userAddMore, userShowInfo, userLocalStoreData] = convertToBooleanVars(changeColor, addMore, showInfo, localStoreData)

	const container = useRef(null)
	//raw storage for backrefs
	const rangeEls = useRef(new Array())
	const [containerRect, setRect] = useState()
	//main datastore
	const [rangeData, setRangeData] = userLocalStoreData ? useSemiPersistentState('rangeData', [], 'factive') : useState([])
	//groomed storage for backrefs
	const [rangeElLookup, setRangeElLookup] = useState([])
	//has rangeElLookup been built
	const [refsconnect, setRefsconnect] = useState(false)
	const [dragging, setDragging] = useState(false)
	const [activeInfoWindow, setActiveInfoWindow] = useState(false)
	const lastDataPoll = useRef(rangeData)

	//memory vars for event handlers
	let currentMouseX, 			//last mouse x pos
	currentContainerRect, 		//rect of nap holder
	limitRect, 					//limit rect for movingEls
	movingEls, 					//array of moving els
	movingOffsets,				//array of mouse pos offsets relative to moving els
	activeIDs,					//array of nap ids moving
	resizeStartWidth,			//width before resize
	resizeStartX,				//mouse x before resize
	reverseResize				//reverse resize from left

	//set time range of container
	const myUnit = units
	Units.setUnit(myUnit)
	const myRange = units == 'time' ? 
		[Units.getPercentFromUnit(range[0],[0,100], 'point'), Units.getPercentFromUnit(range[1],[0,100], 'point')] 
		: [parseInt(range[0]), parseInt(range[1])]
	Units.setRange(myRange)

	useEffect(function() {
		//create data from component children
		setRect(container.current.getBoundingClientRect())
		if (rangeData.length) {
			updateRefs()
			return
		}

		//if there's no saved data, build ranges from children
		const items = Children.map(children, (c, i) => {
			let formattedChild = {
				id: uid.rnd(),
				...defaultRangeProps,
				...c.props,
				x: parseInt(c.props.x),
				size: parseInt(c.props.size),
				name: `Span ${i+1}`
				}

			if (rangeData && rangeData[i]) formattedChild = {...formattedChild, ...rangeData[i], factive: false}
			return formattedChild
		})

		sortXAsc(items)

		setRangeData(items) 
	}, [])

	useEffect(() => {
		//prevent possible disconnection of back-refs
		if (rangeEls.current.length && rangeData?.length) updateRefs()

		//TODO output data as units
		if (onChange && lastDataPoll.current && !arraysEqual(rangeData, lastDataPoll.current)) {
			onChange(rangeData)
		}

		lastDataPoll.current = [...rangeData]
	}, [rangeData])

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
		if (refsconnect && rangeElLookup.length == rangeData.length) return;
		const validRangeEls = rangeEls.current.filter(e => e)
		setRangeElLookup(
			rangeData.map((i) => {
			  let item = {}
			  const ix = validRangeEls.findIndex(e => e.id == i.id)
			  item.id = i.id
			  item.el = validRangeEls[ix].el
			  item.getBounds = validRangeEls[ix].getBounds
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

	function getRange(id) {
		const ix = rangeData.findIndex((e) => e.id == id);
		return rangeData[ix]
	}

	function getRangeRef(id) {
		return rangeElLookup.filter(nte => nte.id == id).shift()
	}

	function setRange(props, id) {
		const ix = rangeData.findIndex((e) => e.id == id)
		let data = [...rangeData]
		data[ix] = {...data[ix], ...props}
		setRangeData(data)
	}

	/**
	 * 
	 * @param {array} ranges [props, id]
	 */
	function setRanges(ranges) {
		let data = [...rangeData]
		ranges.forEach(([props, id]) => {
			const ix = data.findIndex((e) => e.id == id)
			data[ix] = {...data[ix], ...props}
		})
		
		setRangeData(data)
	}

	function addRange({x, size = 10, fixed}) {

		//pick largest gap
		const gaps = rangeData.map((n,i) => {
			if (i == 0) return 0
			return {i: i-1, gap: n.x - (rangeData[i-1].x + rangeData[i-1].size)}
		}).filter(n => n)
		.sort((a,b) => a.gap < b.gap ? 1 : -1)
		//if there is more than one nap
		if (gaps.length > 1) {
			const gap = gaps[0]
			x = rangeData[gap.i].x + rangeData[gap.i].size + 1
			if (gap.gap < 10) size = gap.gap - 4
		} else {
			const gap = rangeData[0]
			x = gap.x < 50 ?
				gap.x + gap.size + 1 :
				gap.x - size - 1
		}

		let newRanges = [...rangeData]
		newRanges.push({
			x: x, 
			size: size, 
			fixed: fixed, 
			name: `Span ${rangeData.length+1}`,
			id: uid.rnd(),
			...defaultRangeProps
		})
		sortXAsc(newRanges)
		setRangeData(newRanges)
	}

	function removeRange(id) {
		let data = [...rangeData]
		const ix = data.findIndex((e) => e.id == id)
		data.splice(ix, 1)
		setRangeData(data)
	}

	function testButton(e) {
		clearCache()
	}

	function handleRangeDown(e, clickedEl, id) { 
		//create dynamic limit box
		createTravelLimits([clickedEl])
		featureInfoWindow(id)

		//register responsive boundaries
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets([clickedEl], e)
		movingEls = [clickedEl]
		// movingRect = createAggregateDimensions(movingEls)
		activeIDs = [id]
		// lastActionTimeStamp = new Date().getTime()
		setRange({factive: true}, id)
		// initClientX = getClientX(e)
		setDragging(true)

		//activate drag handler
		if (e.touches) handleTouchDrag(moveRangeIntent, releaseRange)
		else handleClickDrag(moveRangeIntent, releaseRange)
	}

	function releaseRange(e) {
		let rangesToUpdate = []
		//if cursor has actually moved
		//TODO touch needs a bigger null zone
		if (e.clientX ) {
		activeIDs.forEach(id => {
			const bounds = getRangeRef(id).getBounds()
			const left = getPerc(bounds.left, currentContainerRect.width)
			const width = getPerc(bounds.width, currentContainerRect.width)
			rangesToUpdate.push([{x: left, size: width}, id])
		}) }
		else {
			rangesToUpdate = activeIDs.map(id => [{factive: false}, id])
		}

		setDragging(false)
		setRanges(rangesToUpdate)
	}

	function handleMoveAllDown(e) {
		// initClientX = getClientX(e)
		movingEls = rangeData.map(({id, fixed}) => !fixed ? getRangeRef(id).el : null
		).filter(el => el)
		activeIDs = rangeData.map(({id, fixed}) => !fixed ? id : null).filter(id => id)
		createTravelLimits(movingEls)
		currentContainerRect = getRect(container.current)
		movingOffsets = getOffsets(movingEls, e)
		setRanges(rangeData.map(nd => [{factive: true}, nd.id]))

		if (e.touches) handleTouchDrag(moveRangeIntent, releaseRange)
		else handleClickDrag(moveRangeIntent, releaseRange)
	}

	function handleRangeResizeDown(e, clickedEl, reverse = false, id) {
		let clientX = getClientX(e)
		// initClientX = getClientX(e)
		createTravelLimits([clickedEl])
		featureInfoWindow(id)
		movingEls = [clickedEl]
		activeIDs = [id]
		reverseResize = reverse
		resizeStartX = clientX
		resizeStartWidth = clickedEl.offsetWidth
		currentMouseX = clientX 
		currentContainerRect = getRect(container.current)
		setRange({factive: true}, id)

		if (e.touches) handleTouchDrag(resizeRangeIntent, releaseRange)
		else handleClickDrag(resizeRangeIntent, releaseRange)
	}

	/**
	 * calculate dynamic left & right limits based on container and/or adjacent elements
	 * @param {array} activeEls 
	 */
	function createTravelLimits(activeEls) {
		const otherEls = rangeElLookup.map(({el}) => el).filter(el => !activeEls.includes(el))

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

	function moveRangeIntent(e) {
		let clientX = getClientX(e)
		if (isCollision(clientX)) 
			{snapToLimit(clientX); return}
		currentMouseX = clientX
		movingEls.forEach((me, i) => {
			const mouseX = clientX - currentContainerRect.left - movingOffsets[i]
			moveElement(me, mouseX)
		})
	}

	function resizeRangeIntent(e) {
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
			{rangeData.map((child, index) => 
				<Range 
					fixed={child.fixed}
					containerRect={containerRect} 
					getContainerRect={() => getRect(container.current)} 
					mover={moveElement} 
					sizer={resizeElement}
					downHandler={handleRangeDown} 
					resizeDownHandler={handleRangeResizeDown}
					showInfo={userShowInfo}
					ref={(element) => rangeEls.current.push(element)} 
					key={child.id}
					currentBounds={child.currentBounds}
					timeRange={myRange}
					units={myUnit}
					toggleInfoWindow={toggleInfoWindow}
					{...child} />
			)}

			{typeof gradiation === 'number' || 'string' &&
				<Grades interval={gradiation} units={myUnit} range={myRange} />
			}

			{typeof gradiation === 'object' &&
				gradiation.map((g,i) =>
					<Grade value={g} units={myUnit} range={myRange} key={i}/>
			)}
		</div>

		<div className="thumb ui" onMouseDown={handleMoveAllDown} onTouchStart={handleMoveAllDown}>move all</div>

		{showInfo &&
		<DataPanel 
			rangeData={rangeData} 
			units={myUnit} 
			range={myRange}
			getContainerRect={() => getRect(container.current)}
			updateData={setRange}
			deleteData={removeRange}
			newSpan={addRange}
			maxItems={maxItems}
			addMore={userAddMore}
			changeColor={userChangeColor}
			activeInfoWindow={activeInfoWindow} 
			setActiveInfoWindow={setActiveInfoWindow} />}

		<button onClick={testButton} style={{marginTop: '50px'}}>push me</button>
		</div>
	)
}