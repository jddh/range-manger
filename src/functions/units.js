let unitStore = 'time'
let rangeStore = [0, 100]

export function setUnit(unit) {
	unitStore = unit
}

export function setRange(range) {
	rangeStore = range
}

/**
 * given a percentage, return the ranged value, like time of day
 */
export function getUnitValue(perc, range = rangeStore, format) {
	switch (unitStore) {
		case 'time':
			return percentageOfDayToTime(perc, range, format)
		case 'numerical':
			return percentageToNumerical(perc, range)
	}
}

/**
 * given a percentage, return the ranged quantity, like minutes
 */
export function getUnitAmount(perc, range = rangeStore) {
	switch (unitStore) {
		case 'time':
			return percentageOfDayToMinutes(perc, range)
		case 'numerical':
			return percentageToNumberQuantity(perc, range)
	}
}

export function getPercentFromUnit(val, range = rangeStore) {
	switch (unitStore) {
		case 'time':
			return timeToPercentageOfDay(val, range)
	}
}

function percentageToNumerical(percentage, range = rangeStore) {
	percentage = parseFloat(percentage)
	return ((percentage / 100) * (range[1] - range[0]) + range[0]).toFixed(5)
}

function percentageToNumberQuantity(percentage, range = rangeStore) {
	percentage = parseFloat(percentage)
	const totalQuantity = range[1] - range[0]
	return ((percentage / 100) * totalQuantity).toFixed(5)
}

function percentageOfDayToTime(percentage, range = rangeStore, format = 12) {
	percentage = parseFloat(percentage)
	if (percentage < 0 || percentage > 100) {
		return "Invalid percentage"
	}

	const totalMinutesInDay = 24 * 60
	const rangedMinutesInDay = (24 * 60) * ((range[1] - range[0]) / 100)
	let minutesPassed = (percentage / 100) * totalMinutesInDay;
	const rangeMinutesPassed = ((range[0] / 100) * totalMinutesInDay) + ((percentage / 100) * rangedMinutesInDay)
	minutesPassed = rangeMinutesPassed
	const hours = Math.floor(minutesPassed / 60)
	const minutes = Math.floor(minutesPassed % 60)
	let timeString;

	if (format == 12) {
		const amPm = hours >= 12 ? "PM" : "AM"
		const formattedHours = hours % 12 === 0 ? 12 : hours % 12
		timeString = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${amPm}`
	}
	else {
		const hourString = (hours < 10) ? '0' + hours.toString() : hours.toString()
		const minuteString = (minutes < 10) ? '0' + minutes.toString() : minutes.toString()
		// if (minutes < 10) minuteString = '0' + minuteString

		timeString = hourString + ':' + minuteString
	}

	return timeString
}

/**
 * 
 * @returns 'Nmins'
 */
function percentageOfDayToMinutes(percentage, range = rangeStore) {
	percentage = parseFloat(percentage)
	if (percentage < 0 || percentage > 100) {
		return "Invalid percentage"
	}
	const rangedMinutesInDay = (24 * 60) * ((rangeStore[1] - rangeStore[0]) / 100)
	const rangedMinutes = Math.floor((percentage / 100) * rangedMinutesInDay)

	return rangedMinutes
}

/**
 * given 24 hr time string, return percentage of day
 */
function timeToPercentageOfDay(time24Hour, range = rangeStore) {
	time24Hour = time24Hour.replace(':', '')
	let numericalTime = parseInt(time24Hour);

	if (!numericalTime || numericalTime < 0 || numericalTime > 2359) {
		return 'Invalid time format';
	}

	const hours = Math.floor(numericalTime / 100);
	const minutes = numericalTime % 100;
	const minutesPassed = hours * 60 + minutes;

	const totalMinutesInDay = 24 * 60;
	const rangedMinutesInDay = 24 * 60 * ((range[1] - range[0]) / 100);
	const rangeMinutesPassed = minutesPassed - (range[0] / 100) * totalMinutesInDay;
	const percentage = (rangeMinutesPassed / rangedMinutesInDay) * 100;

	return parseFloat(percentage.toFixed(5))
}

export function minutesToPercentageOfDay(minutes, range = rangeStore) {
	minutes = parseInt(minutes)
	const rangedMinutesInDay = 24 * 60 * ((range[1] - range[0]) / 100)
	const percentage = (minutes / rangedMinutesInDay) * 100

	return parseFloat(percentage.toFixed(5))
}

export function getRoundedTimeValue(percentage, range = rangeStore) {
	const startTime = parseInt(percentageOfDayToTime(percentage, range, 24))
	const roundDown = (startTime % 100) < 30
	let roundedTime = roundDown ? Math.floor(startTime / 100) : Math.ceil(startTime / 100)
	roundedTime *= 100
	const newPercentage = timeToPercentageOfDay(roundedTime, range)

	return [roundedTime, newPercentage]
}