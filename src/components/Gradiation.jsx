import * as Units from '../functions/units'

export default function Gradiation({units, range, count}) {
	let rangeValues = [], roundedValues = [], n = 0

	Units.setUnit(units)
	Units.setRange(range)

	const cqIncrements = 100 / count
	while(n < count) {rangeValues.push(cqIncrements * n++ + (cqIncrements/2))}
	roundedValues = rangeValues.map(r => Units.getRoundedTimeValue(r))

	return (
		<>
			{rangeValues.map((rv, i) =>
				<div 
					className="gradiation" 
					style={{left: rv + 'cqi'}} 
					key={i}>
					{Units.getUnitValue(rv)}
				</div>
			)} 

			{/* {roundedValues.map(([time, per], i) =>
				<div 
					className="gradiation" 
					style={{left: per + 'cqi'}} 
					key={i}>
					{time}
				</div>
			)}  */}
		</>
	)
}