import {useRef} from 'react'

export default function ResizeHandle({downHandler, parent, reverse, id}) {
	const element = useRef(null)

	function handleDown(e) {
		downHandler(e, parent, reverse, id)
	}

	return (
		<div ref={element}
			onMouseDown={handleDown}
			className="resize-handle"
		/>
	)
}