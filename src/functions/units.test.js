import { expect, test, it } from 'vitest'
import * as Units from './units'

test('make good percentage', () => {
	Units.setUnit('numerical')
	expect(Units.getUnitValue(50)).toBe(50)
})

test('make nice range percentage', () => {
	expect(Units.getUnitValue(50, [50,100])).toBe(75)
})

test('make string input nice nice', () => {
	expect(Units.getUnitValue('50')).toBeDefined()
})

test('route numerical case good good', () => {
	expect(Units.getUnitValue(25)).toBe(25)

	const num = (1000 - 200) * .2 + 200
	expect (Units.getUnitValue(20,[200,1000])).toBe(num)
})

test('successful numerical quantity', () => {
	expect(Units.getUnitAmount(25)).toBe(25)

	const quant = (1000 - 200) * .25
	expect(Units.getUnitAmount(25,[200,1000])).toBe(quant)
})

it('makes percentage to minutes nice nice', () => {
	Units.setUnit('time')
	const minutes = 1440 * .2
	expect(Units.getUnitAmount(20)).toBe(minutes)
})

test('12 hr time output', () => {
	Units.setUnit('time')
	expect(Units.getUnitValue(33.4)). toBe('8:00 AM')
})

test('24 hr time output', () => {
	expect(Units.getUnitValue(33.4,[0,100], 24)).toBe('0800')
})

it('should make minutes into percentage', () => {
	const per = 45
	const fractionalMinutes = 1440 * (per/100)
	expect(Units.minutesToPercentageOfDay(fractionalMinutes)).toBe(per)
})

test('round time string', () => {
	const constraint = [Units.getPercentFromUnit('0800',[0,100]), Units.getPercentFromUnit('1800',[0,100])]

	expect(Units.getRoundedTimeValue(58.333333333333336, constraint)[0]).toBe(1400)

	const time = 1124
	const roundedTime = 1100
	const per = Units.getPercentFromUnit(time, constraint)
	expect(Units.getRoundedTimeValue(per, constraint)[0]).toBe(roundedTime)
})