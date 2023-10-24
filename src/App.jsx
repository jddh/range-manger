import { useState } from 'react'
import './App.css'
import ShiftSchedule from './components/ShiftSchedule'
import Nap from './components/Nap'

function App() {

	return (
		<>
			<ShiftSchedule units="time">
				<Nap
					className="first"
					x="0"
					size="10"
					fixed="left"
				/>
				<Nap 
					className="second"
					x="40"
					size="10"
				/>
				<Nap 
					className="second"
					x="60"
					size="10"
				/>
				<Nap
					x="90"
					size="10"
					fixed="right"
				/>
			</ShiftSchedule>
		</>
	)
}

export default App
