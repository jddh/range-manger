import {useRef} from 'react'

export default function ResizeHandle({downHandler, parent, reverse}) {
	const element = useRef(null)

	function handleDown(e) {
		downHandler(e, parent, reverse)
	}

	return (
		<div ref={element}
			onMouseDown={handleDown}
			className="resize-handle"
		/>
	)
}