let unitStore = 'time'

export function setUnit(unit) {
	unitStore = unit
}

export function getUnitValue(perc) {
	switch(unitStore) {
		case 'time':
			return percentageOfDayToTime(perc)
	}
}

function percentageOfDayToTime(percentage) {
	if (percentage < 0 || percentage > 100) {
		return "Invalid percentage";
	}
	
	const totalMinutesInDay = 24 * 60;
	const minutesPassed = (percentage / 100) * totalMinutesInDay;
	const hours = Math.floor(minutesPassed / 60);
	const minutes = Math.floor(minutesPassed % 60);
	const amPm = hours >= 12 ? "PM" : "AM";
	const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
	const timeString = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${amPm}`;

	return timeString;
}
