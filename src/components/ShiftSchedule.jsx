import { useRef, useState, useEffect } from 'react';
import Nap from './Nap';
import './ShiftSchedule.css';

export default function ShiftSchedule() {
	const container = useRef(null);
	const [rect, setRect] = useState();

	useEffect(function() {
		setRect(container.current.getBoundingClientRect())
	}, [])

	function getRect() {
		return container.current.getBoundingClientRect()
	}

	function move(el, x) {
		if (!el) return;
		el.style.left = x + 'px';
	}

	function resize(el, x) {
		if (!el) return;
		el.style.width = x + 'px';
	}

	return (
		<div className="shifts" ref={container}>
			<Nap 
				className="first"
				x="0"
				size="100"
				containerRect={rect}
				getContainerRect={getRect}
				mover={move}
				sizer={resize}
			/>
			<Nap 
				className="second"
				x="500"
				size="100"
				containerRect={rect}
				getContainerRect={getRect}
				mover={move}
				sizer={resize}
			/>
		</div>
	)
}