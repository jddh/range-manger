import './App.css'
import RangeManger, {Range} from '../src/components/RangeManger'

function App() {

	return (
		<>
			<RangeManger 
				gradiation='120'
				localStoreData='false'>

				<Range
					title="Self"
					x="15"
					size="20"
					color="#c23b4d"
					fixed="left"
				/>
				<Range 
					title="and"
					x="40"
					size="20"
					color="#DA87B2"
				/>
				<Range 
					x="65"
					title="Others"
					size="20"
					color="#65B9CA"
					fixed="right"
				/>
			</RangeManger>
		</>
	)
}

export default App
