import { useRef, useState, useEffect, Children, cloneElement } from 'react'
import Nap from './Nap'
import './ShiftSchedule.css'

export default function ShiftSchedule({children}) {
	const container = useRef(null)
	const napEls = useRef(new Array())
	const [rect, setRect] = useState()

	useEffect(function() {
		setRect(container.current.getBoundingClientRect())
	}, [])

	function getRect() {
		return container.current.getBoundingClientRect()
	}

	function handleNapDown(e, clickedEl) {
		//create dynamic bounding box
		let dynamicEls = napEls.current.filter(el => el != null && el != clickedEl)
		dynamicEls = [...new Set(dynamicEls)]	//unique
		const thisRect = clickedEl.getBoundingClientRect()
		let lefts = dynamicEls.map(n => n.getBoundingClientRect().right)
		lefts.push(rect.left)
		lefts = lefts.filter(e => e < thisRect.left)

		let rights = dynamicEls.map(n => n.getBoundingClientRect().left)
		rights.push(rect.right)
		rights = rights.filter(e => e > thisRect.right)

		const sortAsc = (a,b) => a-b
		const dynamicRect = {left: lefts.sort(sortAsc)[lefts.length-1], right: rights.sort(sortAsc)[0]}
	}

	function move(el, x) {
		if (!el) return
		el.style.left = x + 'px'
	}

	function resize(el, x) {
		if (!el) return
		el.style.width = x + 'px'
	}

	return (
		<div className="shifts" ref={container}>
			{Children.map(children, (child, index) => 
				<Nap 
					containerRect={rect} 
					getContainerRect={getRect} 
					mover={move} 
					sizer={resize}
					downHandler={handleNapDown} 
					ref={(element) => napEls.current.push(element)} 
					{...child.props} />
			)}
		</div>
	)
}