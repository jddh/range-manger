import * as Units from '../functions/units'

export default function Grade({units, range, value}) {
	let rangeValues = [], n = 0

	Units.setUnit(units)
	Units.setGamut(range)

	const percentValue = Units.getPercentFromUnit(value, range, 'point')

	// const cqIncrements = 100 / count
	// while(n < count) {rangeValues.push(cqIncrements * n++ + (cqIncrements/2))}

	return (
		<>
			<div 
				className="gradiation" 
				style={{left: percentValue + '%'}} >
				<span>{value}</span>
			</div>
		</>
	)
}