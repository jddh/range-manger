import { useEffect, useRef } from 'react'
import { getRect } from '../functions/geometry'
import classNames from 'classnames'
import * as Units from '../functions/units'

export default function DataPanel ({spanData, units, range, updateData, deleteData, newSpan, maxItems, addMore, activeInfoWindow, getContainerRect, setActiveInfoWindow, changeColor}) {

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
	Units.setRange(range)

	//TODO if any nap can have fixed values, all the handlers need to account for which edges are available for resize
	function handleStartChange(e, spanNode) {
		updateData({x: Units.getPercentFromUnit(e.target.value, range, 'point')}, spanNode.id)
	}

	function handleLengthChange(e, spanNode) {
		updateData({size: Units.getPercentFromUnit(e.target.value, range, 'minutes')}, spanNode.id)
	}

	const handleIntervalChange = (e, index) => {
		const child = spanData[index]
		const sibling =  spanData[index + 1]
		const distance = Units.getPercentFromUnit(e.target.value, range, 'minutes')
		if (sibling.fixed == 'right') {
			const currentX = sibling.x
			const newX = (child.x + child.size) + distance
			const delta = currentX - newX
			const newSize = sibling.size + delta
			updateData({x: newX, size: newSize}, sibling.id)
		}
		else {
			const newX = (child.x + child.size) + distance
			updateData({x: newX}, sibling.id)
		}
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
	spanData.forEach((child, index) => {
		if (spanData[index+1]) intervals[index] = true
	})
	const unitFieldType = (units == 'time') ? 'time' : 'number'
	const unitStep = (units == 'time') ? "1" : (range[1] - range[0]) / 1000
	const fixedLabels = ['No', 'Left', 'Right', 'Both']
	const fixedValues = ['', 'left', 'right', 'both']

	let showWindow
	if (activeInfoWindow)
		showWindow = spanData.map(child => activeInfoWindow[0] == child.id)	
	else showWindow = []

	return (
		<div className="data-panels">
			{spanData.map((child, index) => 
				<div
					ref={showWindow[index] ? activePanelRef : null}
					className={classNames({active: showWindow[index]}, 'data-panel')} 
					key={child.id}
				>

					<button className="close" onClick={handleClose}>x</button>

					<div className='no-label fieldset'><input type="text" defaultValue={child.name} onBlur={(e) => handleNameChange(e, child)} /></div>

					<div className='fieldset'>
						<label >start </label>
						<input className='output' value={Units.getUnitValue(child.x,range,24)} onChange={e => handleStartChange(e, child)} type={unitFieldType} step={unitStep}  />
					</div>

					<div className='fieldset'>
						<label>length </label>
						<input className='output' type="number" step={unitStep} value={Units.getUnitAmount(child.size)} onChange={e => handleLengthChange(e, child)} />
					</div>

					<div className='fieldset'><label > end </label><input className='output' value={Units.getUnitValue(child.x + child.size)} type='text' disabled /></div>

					{intervals[index] && 
						<div className='fieldset'>
						<label > interval </label><input className='output' value={Units.getUnitAmount((spanData[index+1].x) - (child.x + child.size))} onChange={e => handleIntervalChange(e, index)} type="number" />
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
				<button className="add" disabled={spanData.length >= maxItems} onClick={newSpan}>add</button>
			</div>}
		</div>
	)
}