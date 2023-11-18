import * as Units from '../functions/units'

export default function Gradiation({units, range, interval}) {
	
	Units.setUnit(units)
	Units.setRange(range)

	const absIntervalPercentage = Units.getPercentFromUnit(interval, [0,100], 'minutes')
	const intervalPercentage = Units.getPercentFromUnit(interval, range, 'minutes')
	const numberOfGrades = Math.floor((range[1] - range[0]) / absIntervalPercentage)
	const rangeValues = Array(numberOfGrades).fill(0).map((_, i) => intervalPercentage * (i+1))

	return (
		<>
			{rangeValues.map((rv, i) =>
				{if (rv < 100) {
					return <div 
						className="gradiation" 
						style={{left: rv + '%'}} 
						key={i}>
						<span>{Units.getUnitValue(rv)}</span>
					</div>}
				}
			)} 
		</>
	)
}