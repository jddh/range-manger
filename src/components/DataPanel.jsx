import { useEffect, useRef } from 'react'
import { getRect } from '../functions/geometry'
import classNames from 'classnames'
import * as Units from '../functions/units'

export default function DataPanel ({rangeData, units, gamut, updateData, deleteData, addRange, maxItems, addMore, activeInfoWindow, getContainerRect, setActiveInfoWindow, changeColor, transformRange}) {

	const activePanelRef = useRef(null)

	//position panel popup relative to size of span and container
	useEffect(() => {
		if (!activeInfoWindow) return
		const panelWidth = getRect(activePanelRef.current).width
		let leftPos = activeInfoWindow[1].left + activeInfoWindow[1].width/2 - panelWidth/2
		activePanelRef.current.style.left = leftPos + 'px'
		//adjust for container edges
		const positionedPanelRect = getRect(activePanelRef.current)
		const containerRect = getContainerRect()
		if (positionedPanelRect.right > containerRect.right)
			leftPos = leftPos - (positionedPanelRect.right - containerRect.right)
		if (positionedPanelRect.left < containerRect.left)
			leftPos = leftPos - (positionedPanelRect.left - containerRect.left)
		activePanelRef.current.style.left = leftPos + 'px'
	}, [activeInfoWindow])

	Units.setUnit(units)
	Units.setGamut(gamut)

	function handleStartChange(e, spanNode) {
		transformRange({x: e.target.value}, 'start', spanNode.id)
	}

	function handleLengthChange(e, spanNode) {
		transformRange({size: e.target.value}, 'resize', spanNode.id)
	}

	const handleIntervalChange = (e, index) => {
		const child = rangeData[index]
		const sibling =  rangeData[index + 1]

		transformRange({distance: e.target.value, width: child.x+child.size}, 'interval', sibling.id)
	}

	function handleFixedChange(e, spanNode) {
		updateData({fixed: e.target.value}, spanNode.id)
	}

	function handleClose() {
		setActiveInfoWindow(false)
	}

	function handleRemove(id) {
		deleteData(id)
	}

	function handleColourChange(e, child) {
		updateData({color: e.target.value}, child.id)
	}

	function handleNameChange(e, child) {
		updateData({name: e.target.value}, child.id)
	}

	//render
	let intervals = []	//if given child has a sibling, show interval field
	rangeData.forEach((child, index) => {
		if (rangeData[index+1]) intervals[index] = true
	})
	const unitFieldType = (units == 'time') ? 'time' : 'number'
	const unitStep = (units == 'time') ? "1" : (gamut[1] - gamut[0]) / 1000
	const fixedLabels = ['No', 'Left', 'Right', 'Both']
	const fixedValues = ['', 'left', 'right', 'both']

	let showWindow
	if (activeInfoWindow)
		showWindow = rangeData.map(child => activeInfoWindow[0] == child.id)	
	else showWindow = []

	return (
		<div className="data-panels">
			{rangeData.map((child, index) => 
				<div
					ref={showWindow[index] ? activePanelRef : null}
					className={classNames({active: showWindow[index]}, 'data-panel')} 
					key={child.id}
				>

					<button className="close" onClick={handleClose}>x</button>

					<div className='no-label fieldset'><input type="text" defaultValue={child.name} onBlur={(e) => handleNameChange(e, child)} /></div>

					<div className='fieldset'>
						<label >start </label>
						<input className='output' value={Units.getUnitValue(child.x,gamut,24)} onChange={e => handleStartChange(e, child)} type={unitFieldType} step={unitStep}  />
					</div>

					<div className='fieldset'>
						<label>length </label>
						<input className='output' type="number" step={unitStep} value={Units.getUnitAmount(child.size)} onChange={e => handleLengthChange(e, child)} />
					</div>

					<div className='fieldset'><label > end </label><input className='output' value={Units.getUnitValue(child.x + child.size)} type='text' disabled /></div>

					{intervals[index] && 
						<div className='fieldset'>
						<label > interval </label><input className='output' value={Units.getUnitAmount((rangeData[index+1].x) - (child.x + child.size))} onChange={e => handleIntervalChange(e, index)} type="number" />
						</div>}

					<div className='fieldset'>
						<label>fixed </label>
						<select name="" id="" defaultValue={child.fixed} onChange={e => handleFixedChange(e, child)}>
							{fixedValues.map((fv, i) =>
								<option value={fv}  key={i} >{fixedLabels[i]}</option>
							)}
						</select>
					</div>

					{changeColor &&
					<div className='fieldset no-label'>
						<input type="color" defaultValue={child.color} onChange={(e) => handleColourChange(e, child)} />
					</div>}

					<div className='fieldset no-label'>
						<button className="rm" onClick={() => handleRemove(child.id)}>Remove</button>
					</div>
				</div>
			)}

			{addMore && 
			<div className="meta-controls">
				<button className="add" disabled={rangeData.length >= maxItems} onClick={addRange}>add</button>
			</div>}
		</div>
	)
}