import {useRef} from 'react'
import classNames from 'classnames'

export default function ResizeHandle({downHandler, parent, reverse, className, id}) {
	const element = useRef(null)

	function handleDown(e) {
		downHandler(e, parent, reverse, id)
	}

	return (
		<div ref={element}
			onMouseDown={handleDown}
			onTouchStart={handleDown}
			className={classNames(className, 'resize-handle')}
		/>
	)
}