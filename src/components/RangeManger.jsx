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
import './RangeManger-theme.css'


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

//TODO input prop to override defaults
const defaultRangeProps = {color: '#96D3FF', x: 0, size: 10}

export default function RangeManger({
		disableTouchDrag = true,
		maxItems = 5,
		units = 'time', 
		gamut = ['700','2100'],
		gradiation = 120,
		changeColor = true,
		addMore = true,
		showInfo = true,
		localStoreData = true,
		showTitles = true,
		useTheme = true,
		pxGrid = .2,
		minRangeSize = 40,
		onChange,
		children
	}) {

	const [userChangeColor, userAddMore, userShowInfo, userLocalStoreData, userShowTitles, userUseTheme] = convertToBooleanVars(changeColor, addMore, showInfo, localStoreData, showTitles, useTheme)

	const container = useRef(null)
	//raw storage for backrefs
	const rangeEls = useRef(new Array())
	//groomed storage for backrefs
	const [rangeElLookup, setRangeElLookup] = useState([])
	const [containerRect, setRect] = useState()
	//main datastore
	const [rangeData, setRangeData] = userLocalStoreData ? useSemiPersistentState('rangeData', [], 'factive') : useState([])
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
	const userGamut = units == 'time' ? 
		[Units.getPercentFromUnit(gamut[0],[0,100], 'point'), Units.getPercentFromUnit(gamut[1],[0,100], 'point')] 
		: [parseInt(gamut[0]), parseInt(gamut[1])]
	Units.setGamut(userGamut)

	useEffect(function() {
		//create data from component children
		setRect(container.current.getBoundingClientRect())
		if (rangeData.length) {
			updateRefs()
			return
		}

		//if there's no saved data, build ranges from children
		let items = Children.map(children, (c, i) => {
			let formattedChild = {
				id: uid.rnd(),
				...defaultRangeProps,
				...c.props,
				x: parseInt(c.props.x) || defaultRangeProps.x,
				size: parseInt(c.props.size) || defaultRangeProps.size,
				name: c.props.title || `Span ${i+1}`
				}

			if (rangeData && rangeData[i]) formattedChild = {...formattedChild, ...rangeData[i], factive: false}
			return formattedChild
		})
		if (Children.count(children)) sortXAsc(items)
		else items = []

		setRangeData(items) 
	}, [])

	useEffect(() => {
		if (!rangeData) return
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
		return gridSnap(getPerc(px, container), pxGrid) + suffix
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

	function addRange({x = 0, size = 10, fixed}) {
		currentContainerRect = getRect(container.current)
		if (rangeData.length) {
			//pick largest gap
			const lastRangeIndex = rangeData.length-1
			const gaps = rangeData.slice(1).map((n,i) => 
				[(rangeData[i].x + rangeData[i].size), rangeData[i+1].x]
			)
			gaps.push([0, rangeData[0].x],
			[rangeData[lastRangeIndex].x + rangeData[lastRangeIndex].size, 100])

			gaps.sort((a,b) => (b[1]-b[0]) - (a[1]-a[0]))
			//if there is more than one range
			if (gaps.length > 1) {
				let candidate
				const gap = gaps[0]
				x = gap[0] + 1
				size = Math.min(size, (gap[1]-gap[0]) - 1)
			} else {
				const gap = rangeData[0]
				x = gap.x < 50 ?
					gap.x + gap.size + 1 :
					gap.x - size - 1
			}
			//TODO feedback on unusable result
			if (size < 3) return
		}

		let newRanges = [...rangeData]
		newRanges.push({
			...defaultRangeProps,
			x: x, 
			size: size, 
			fixed: fixed, 
			name: `Span ${rangeData.length+1}`,
			id: uid.rnd()
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

	/**
	 * determine if any elements collide given pointer intent
	 * @param {number} mouseX 
	 * @param {number} intent 
	 * @returns {boolean|string}
	 */
	function isCollision(mouseX, intent) {
		const rect = createAggregateDimensions(movingEls)
		let mouseIntent
		if (mouseX) mouseIntent = mouseX - currentMouseX	// +1 for right
		else mouseIntent = intent
		if (rect.right + mouseIntent >= limitRect.right && mouseIntent > 0)
			return 'right'
		if(rect.left + mouseIntent <= limitRect.left && mouseIntent < 0)
			return 'left'
		else return false
	}

	/**
	 * determine if any data ranges collide given pointer intent
	 * @param {number} direction 
	 * @param {string} action
	 * @param {string} id 
	 * @returns {boolean|string}
	 */
	function isDataCollision(data, direction, action, id) {
		let collide = false
		const nodes = sortXAsc([...rangeData])
		const thisIndex = nodes.findIndex(n => n.id == id)
		const rightEdge = {x: 100, right: 100}
		const thisNode = nodes[thisIndex]
		const sibNode = nodes[thisIndex + 1] || rightEdge
		const preNode = (thisIndex > 0) ? nodes[thisIndex-1] : {x:0,right:0, size: 0}
		thisNode.right = thisNode.x + thisNode.size
		sibNode.right = sibNode.x + sibNode.size
		preNode.right = preNode.x + preNode.size
		/**
		 * 1. increase size && sibling block
		 * 2. increase start && sibling block
		 * 3. decrease start && pre block
		 * 4. increase interval && sibsib block
		 * 5. decrease interval && self block
		 */
		if (
			thisNode.right + direction > sibNode.x ||
			(action == 'start' || 'interval') && thisNode.x + direction < preNode.right 
		)
			collide = true

		return collide
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

	function resizeRangeIntent(e, x) {
		let clientX = getClientX(e)
		let delta = clientX - resizeStartX
		if (reverseResize) delta *= -1
		const collide = isCollision(clientX)
		if ((collide == 'left' && reverseResize)
			|| (collide == 'right' && !reverseResize)) {
			snapToLimit(clientX, 'resize')
			return
		}
		if (resizeStartWidth + delta <= minRangeSize) return
		const reverseMotion = reverseResize ? clientX - currentMouseX : false
		currentMouseX = clientX

		resizeElement(movingEls[0], resizeStartWidth + delta, reverseMotion)
	}

	function transformRangeOld(transforms, intent, id) {
	currentContainerRect = getRect(container.current)
	const rangeEl = getRangeRef(id).el
	const rangeRect = getRangeRef(id).getBounds()
	switch(intent) {
		case 'resize':
			// const rqSizePx = Math.ceil((Units.getPercentFromUnit(transforms.size, myRange, 'range') / 100) * currentContainerRect.width)
			const rqSizePx = rangeRect.width + 1
			const delta = rqSizePx - rangeRect.width
			console.log(delta);
			resizeStartX = resizeStartWidth = rangeRect.width
			movingEls = [rangeEl]
			createTravelLimits(movingEls)
			resizeRangeIntent({clientX: rqSizePx})
		break
	}
	}

	/**
	 * change range props, given unit values
	 * @param {object} transforms 
	 * @param {string} action 
	 * @param {string} id 
	 */
	//TODO ensure each step has a sufficient storage-side change so that values don't get softlocked by conversion
	function transformRange(transforms, action, id) {
	currentContainerRect = getRect(container.current)
	const range = getRange(id)
	let direction
	switch(action) {
		case 'resize':
			const newSize = Units.getPercentFromUnit(transforms.size, userGamut, 'range')
			direction = newSize - range.size
			const newSizePx = (newSize/100) * currentContainerRect.width
			if (newSizePx <= minRangeSize) return
			if (!isDataCollision({size: newSize}, direction, action, id))
				setRange({size: newSize}, id)
		break
		case 'start':
			const newX = Units.getPercentFromUnit(transforms.x, userGamut, 'point')
			direction = newX - range.x
			if (!isDataCollision({x: newX}, direction, action, id))
				setRange({x: newX}, id)
		break
		case 'interval':
			const newDistance = Units.getPercentFromUnit(transforms.distance, userGamut, 'range')
			const newSiblingX = transforms.width + newDistance
			direction = newSiblingX - range.x
			if (!isDataCollision({x: newSiblingX}, direction, action, id))
				setRange({x: newSiblingX}, id)
	}
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
		<div className={classNames({'disable-touch-drag': disableTouchDrag, theme: userUseTheme}, 'range-manger')}>
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
					showTitles={userShowTitles}
					currentBounds={child.currentBounds}
					gamut={userGamut}
					units={myUnit}
					pxGrid={pxGrid}
					toggleInfoWindow={toggleInfoWindow}
					{...child} />
			)}

			{typeof gradiation === 'number' || 'string' &&
				<Grades interval={gradiation} units={myUnit} range={userGamut} />
			}

			{typeof gradiation === 'object' &&
				gradiation.map((g,i) =>
					<Grade value={g} units={myUnit} range={userGamut} key={i}/>
			)}
		</div>

		<div className="thumb ui" onMouseDown={handleMoveAllDown} onTouchStart={handleMoveAllDown}>move all</div>

		{showInfo &&
		<DataPanel 
			rangeData={rangeData} 
			units={myUnit} 
			gamut={userGamut}
			getContainerRect={() => getRect(container.current)}
			updateData={setRange}
			deleteData={removeRange}
			transformRange={transformRange}
			addRange={addRange}
			maxItems={maxItems}
			addMore={userAddMore}
			changeColor={userChangeColor}
			activeInfoWindow={activeInfoWindow} 
			setActiveInfoWindow={setActiveInfoWindow} />}
		</div>
	)
}

export {Range}