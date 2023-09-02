import { useState } from 'react'
import './App.css'
import ShiftSchedule from './components/ShiftSchedule'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ShiftSchedule />
    </>
  )
}

export default App
