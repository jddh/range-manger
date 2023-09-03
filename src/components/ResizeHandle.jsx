import {useRef} from 'react'
import handleClickDrag from '../functions/handleClickDrag'
import handleTouchDrag from '../functions/handleTouchDrag'

let downPos, downSize;

export default function ResizeHandle({containerRect, mover, sizer, downHandler, parent}) {
	const element = useRef(null)

	function handleDown(e) {
		// downPos = e.clientX
		// downSize = parent.offsetWidth
		// handleClickDrag(drag)

		downHandler(e, parent)
	}

	// function drag(e) {
	// 	const delta = e.clientX - downPos
	// 	sizer(parent, (downSize + delta))

	// 	// console.log(delta);
	// }

	return (
		<div ref={element}
			onMouseDown={handleDown}
			className="resize-handle"
		/>
	)
}