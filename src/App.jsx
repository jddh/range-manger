import { useState } from 'react'
import './App.css'
import ShiftSchedule from './components/ShiftSchedule'
import Nap from './components/Nap'

function App() {
	const [count, setCount] = useState(0)

	return (
		<>
			<ShiftSchedule>
				<Nap
					className="first"
					x="0"
					size="100"
				/>
				<Nap 
					className="second"
					x="500"
					size="100"
				/>
			</ShiftSchedule>
		</>
	)
}

export default App
