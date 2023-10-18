import * as Units from '../functions/units'

function handleFieldChange(e, child) {
	console.log(e.target.value, child)
}

export default function DataPanel ({spanData, units, range, updateData}) {
	Units.setUnit(units)
	Units.setRange(range)

	function handleStartTimeChange(e, spanNode) {
		updateData({x: Units.getPercentFromUnit(e.target.value)}, spanNode.id)
	}

	//render
	let intervals = []
	spanData.forEach((child, index) => {
		if (spanData[index+1]) intervals[index] = true
	})

	return (
		<div className="data-panels">
			{spanData.map((child, index) => 
				<div className="data-panel" key={child.id}>
					<h4>Span {index+1}</h4>

					<label >start </label><input className='output' value={Units.getUnitValue(child.x,range,24)} onChange={e => handleStartTimeChange(e, child)} type='time'   />

					<label>length </label><input className='output' type="number" value={Units.getUnitAmount(child.size)} />

					<label > end </label><input className='output' value={Units.getUnitValue(child.x + child.size)} type='text' disabled />

					{intervals[index] && 
						<>
						<label > interval </label><input className='output' value={Units.getUnitAmount((spanData[index+1].x) - (child.x + child.size))} type='text' disabled />
						</>}
				</div>
			)}
		</div>
	)
}