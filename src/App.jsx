import { useState } from 'react'
import './App.css'
import RangeManger from './components/RangeManger'
import Range from './components/Range'

function iChanged(data) {
	// console.log('a change: ', data);
}

function App() {

	return (
		<>
			<RangeManger 
				// units="time"
				// units="numerical"
				// gamut={['900', '1800']}
				// gamut={['50', '1500']}
				// gradiation={['400', '1100']}
				gradiation='120'
				// changeColor='false'
				// addMore='false'
				// showInfo="false"
				// localStoreData='false'
				// showTitles='false'
				onChange={iChanged}>

				<Range
					className="first"
					x="0"
					size="10"
					fixed="left"
				/>
				<Range 
					className="second"
					x="40"
					size="10"
					color="#32a976"
				/>
				<Range 
					title="hihi"
					x="60"
					size="10"
				/>
				<Range
					x="90"
					size="10"
					fixed="right"
				/>
			</RangeManger>
		</>
	)
}

export default App
