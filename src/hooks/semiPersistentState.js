import React from "react";

export default function useSemiPersistentState(key,defaultValue,stripKey) {
	let storedValue = localStorage.getItem(key) && JSON.parse(localStorage.getItem(key));
	const [state, setState] = 
		React.useState(storedValue || defaultValue);

	React.useEffect(() => {
		let newState = [...state]
		if (stripKey) newState = stripProperty(stripKey, newState)
		localStorage.setItem(key, JSON.stringify(newState))
	}, [state]);

	return [state, setState];
}

function stripProperty(key, state) {
	state.forEach(n => {
		if (n[key]) delete n[key]
	})
	
	return state;
}