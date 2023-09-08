import { useState } from 'react'
import './App.css'
import ShiftSchedule from './components/ShiftSchedule'
import Nap from './components/Nap'

if (import.meta.hot) {
	import.meta.hot.on('hmr-update', (data) => {
	  // perform custom update
	  console.log('hihi');
	})
  }

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
