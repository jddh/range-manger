import * as Units from '../functions/units'

export default function Gradiation({units, range, count}) {
	let rangeValues = [], n = 0

	Units.setUnit(units)
	Units.setRange(range)

	const cqIncrements = 100 / count
	while(n < count) {rangeValues.push(cqIncrements * n++ + (cqIncrements/2))}

	return (
		<>
			{rangeValues.map((cd, i) =>
				<div 
					className="gradiation" 
					style={{left: cd + 'cqi'}} 
					key={i}>
					{Units.getUnitValue(cd)}
				</div>
			)} 
		</>
	)
}