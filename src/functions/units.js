let unitStore = 'time'
let gamutStore = [0, 100]

export function setUnit(unit) {
	unitStore = unit
}

export function setGamut(gamut) {
	gamutStore = gamut
}

/**
 * given a percentage, return the ranged value, like time of day
 */
export function getUnitValue(perc, gamut = gamutStore, format) {
	switch (unitStore) {
		case 'time':
			return percentageOfDayToTime(perc, gamut, format)
		case 'numerical':
			return percentageToNumerical(perc, gamut)
	}
}

/**
 * given a percentage, return the ranged quantity, like minutes
 */
export function getUnitAmount(perc, gamut = gamutStore) {
	switch (unitStore) {
		case 'time':
			return percentageOfDayToMinutes(perc, gamut)
		case 'numerical':
			return percentageToNumberQuantity(perc, gamut)
	}
}

/**
 * 
 * @param {string} type - 'point' for a single value, eg. 12:00; 'gamut' for eg. 150 minutes 
 * @returns 
 */
export function getPercentFromUnit(val, gamut = gamutStore, type = 'clock') {
	switch (unitStore) {
		case 'time':
			return (type == 'point') ? timeToPercentageOfDay(val, gamut) : minutesToPercentageOfDay(val, gamut)
		case 'numerical':
			return (type == 'point') ? numericalToPercentage(val, gamut) : (val / (gamut[1] - gamut[0])) * 100
	}
}

function percentageToNumerical(percentage, gamut = gamutStore) {
	percentage = parseFloat(percentage)
	return parseFloat(((percentage / 100) * (gamut[1] - gamut[0]) + gamut[0]).toFixed(2))
}

function percentageToNumberQuantity(percentage, gamut = gamutStore) {
	percentage = parseFloat(percentage)
	const totalQuantity = gamut[1] - gamut[0]
	return parseFloat(((percentage / 100) * totalQuantity).toFixed(2))
}

/**
 * eg single number value relative to gamut
 */
function numericalToPercentage(number, gamut = gamutStore) {
	return ((number - gamut[0]) / (gamut[1] - gamut[0])) * 100
}

function percentageOfDayToTime(percentage, gamut = gamutStore, format = 12) {
	percentage = parseFloat(percentage)
	if (percentage < 0 || percentage > 100) {
		return "Invalid percentage"
	}

	const totalMinutesInDay = 24 * 60
	const rangedMinutesInDay = (24 * 60) * ((gamut[1] - gamut[0]) / 100)
	let minutesPassed = (percentage / 100) * totalMinutesInDay;
	const rangeMinutesPassed = ((gamut[0] / 100) * totalMinutesInDay) + ((percentage / 100) * rangedMinutesInDay)
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
function percentageOfDayToMinutes(percentage, gamut = gamutStore) {
	percentage = parseFloat(percentage)
	if (percentage < 0 || percentage > 100) {
		return "Invalid percentage"
	}
	const rangedMinutesInDay = (24 * 60) * ((gamutStore[1] - gamutStore[0]) / 100)
	const rangedMinutes = Math.round((percentage / 100) * rangedMinutesInDay)

	return rangedMinutes
}

/**
 * given 24 hr time string, return percentage of day
 */
function timeToPercentageOfDay(time24Hour, gamut = gamutStore) {
	if (typeof time24Hour === 'string') time24Hour = time24Hour.replace(':', '')
	let numericalTime = parseInt(time24Hour);

	if (!numericalTime || numericalTime < 0 || numericalTime > 2359) {
		return 'Invalid time format';
	}

	const hours = Math.floor(numericalTime / 100);
	const minutes = numericalTime % 100;
	const minutesPassed = hours * 60 + minutes;

	const totalMinutesInDay = 24 * 60;
	const rangedMinutesInDay = 24 * 60 * ((gamut[1] - gamut[0]) / 100);
	const rangeMinutesPassed = minutesPassed - (gamut[0] / 100) * totalMinutesInDay;
	const percentage = (rangeMinutesPassed / rangedMinutesInDay) * 100;

	return parseFloat(percentage.toFixed(5))
}

function minutesToPercentageOfDay(minutes, gamut = gamutStore) {
	minutes = parseInt(minutes)
	const rangedMinutesInDay = 24 * 60 * ((gamut[1] - gamut[0]) / 100)
	const percentage = (minutes / rangedMinutesInDay) * 100

	return parseFloat(percentage.toFixed(5))
}

export function getRoundedTimeValue(percentage, gamut = gamutStore) {
	const startTime = parseInt(percentageOfDayToTime(percentage, gamut, 24))
	const roundDown = (startTime % 100) < 30
	let roundedTime = roundDown ? Math.floor(startTime / 100) : Math.ceil(startTime / 100)
	roundedTime *= 100
	const newPercentage = timeToPercentageOfDay(roundedTime, gamut)

	return [roundedTime, newPercentage]
}