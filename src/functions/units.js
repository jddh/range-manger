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

	// Calculate the total number of minutes in a day
	const totalMinutesInDay = 24 * 60;

	// Calculate the number of minutes passed based on the percentage
	const minutesPassed = (percentage / 100) * totalMinutesInDay;

	// Calculate hours and minutes
	const hours = Math.floor(minutesPassed / 60);
	const minutes = Math.floor(minutesPassed % 60);

	// Determine AM or PM
	const amPm = hours >= 12 ? "PM" : "AM";

	// Convert hours to 12-hour format
	const formattedHours = hours % 12 === 0 ? 12 : hours % 12;

	// Create the time string
	const timeString = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${amPm}`;

	return timeString;
}
