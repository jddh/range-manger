import * as Units from '../functions/units'

function handleFieldChange(e, child) {
	console.log(e.target.value, child)
}

export default function DataPanel ({spanData, units, range, updateData}) {
	Units.setUnit(units)
	Units.setRange(range)

	function handleStartChange(e, spanNode) {
		updateData({x: Units.getPercentFromUnit(e.target.value)}, spanNode.id)
	}

	function handleLengthChange(e, spanNode) {
		console.log(e.target.value);
		updateData({size: Units.getPercentFromUnit(e.target.value, range, 'minutes')}, spanNode.id)
	}

	const handleIntervalChange = (e, index) => {
		const child = spanData[index]
		const sibling =  spanData[index + 1]
		const distance = Units.getPercentFromUnit(e.target.value, range, 'minutes')
		//TODO if sibling is fixed, change length, not position
		const newX = (child.x + child.size) + distance
		updateData({x: newX}, sibling.id)
	}

	//render
	let intervals = []	//if given child has a sibling, show interval field
	spanData.forEach((child, index) => {
		if (spanData[index+1]) intervals[index] = true
	})
	const unitFieldType = (units == 'time') ? 'time' : 'number'
	const unitStep = (units == 'time') ? "1" : ".01"

	return (
		<div className="data-panels">
			{spanData.map((child, index) => 
				<div className="data-panel" key={child.id}>
					<h4>Span {index+1}</h4>

					<label >start </label><input className='output' value={Units.getUnitValue(child.x,range,24)} onChange={e => handleStartChange(e, child)} type={unitFieldType} step={unitStep}  />

					<label>length </label><input className='output' type="number" step={unitStep} value={Units.getUnitAmount(child.size)} onChange={e => handleLengthChange(e, child)} />

					<label > end </label><input className='output' value={Units.getUnitValue(child.x + child.size)} type='text' disabled />

					{intervals[index] && 
						<>
						<label > interval </label><input className='output' value={Units.getUnitAmount((spanData[index+1].x) - (child.x + child.size))} onChange={e => handleIntervalChange(e, index)} type="number" />
						</>}
				</div>
			)}
		</div>
	)
}