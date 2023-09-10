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
				/>
				<Nap 
					className="second"
					x="40"
					size="10"
				/>
			</ShiftSchedule>
		</>
	)
}

export default App
